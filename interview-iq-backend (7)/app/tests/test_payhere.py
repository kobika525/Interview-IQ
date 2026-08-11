import hashlib

from app.config import settings
from app.services.subscription_service import SubscriptionService


MERCHANT_ID = "1210000"
MERCHANT_SECRET = "sandbox-secret"


def _enable(monkeypatch):
    monkeypatch.setattr(settings, "PAYMENT_MODE", "payhere")
    monkeypatch.setattr(settings, "PAYHERE_SANDBOX", True)
    monkeypatch.setattr(settings, "PAYHERE_MERCHANT_ID", MERCHANT_ID)
    monkeypatch.setattr(settings, "PAYHERE_MERCHANT_SECRET", MERCHANT_SECRET)
    monkeypatch.setattr(settings, "PAYHERE_NOTIFY_URL", "https://example.test/api/subscriptions/payhere/notify")


def _checkout(client, headers, plan_code="basic", billing_cycle="month"):
    response = client.post("/api/subscriptions/payhere/checkout", headers=headers, json={
        "plan_code": plan_code, "billing_cycle": billing_cycle, "phone": "0771234567",
        "address": "1 Main Street", "city": "Colombo",
    })
    assert response.status_code == 201
    return response.json()["data"]["fields"]


def _notification(fields, status="2", payment_id="320000001"):
    secret_hash = hashlib.md5(MERCHANT_SECRET.encode()).hexdigest().upper()
    text = f"{MERCHANT_ID}{fields['order_id']}{fields['amount']}{fields['currency']}{status}{secret_hash}"
    return {
        "merchant_id": MERCHANT_ID, "order_id": fields["order_id"],
        "payhere_amount": fields["amount"], "payhere_currency": fields["currency"],
        "status_code": status, "md5sig": hashlib.md5(text.encode()).hexdigest().upper(),
        "payment_id": payment_id, "method": "VISA",
    }


def test_payhere_checkout_hash_generation(client, register_and_login, monkeypatch):
    _enable(monkeypatch)
    fields = _checkout(client, register_and_login())
    secret_hash = SubscriptionService._payhere_md5(MERCHANT_SECRET)
    expected = SubscriptionService._payhere_md5(
        f"{MERCHANT_ID}{fields['order_id']}{fields['amount']}{fields['currency']}{secret_hash}"
    )
    assert fields["hash"] == expected
    assert fields["merchant_id"] == MERCHANT_ID
    assert "sandbox.payhere.lk" not in str(fields)  # checkout URL is returned separately


def test_lkr_plan_prices_are_sent_to_payhere_exactly(client, register_and_login, monkeypatch):
    _enable(monkeypatch)
    headers = register_and_login()
    plans = {item["code"]: item for item in client.get("/api/subscriptions/plans").json()["data"]}
    assert plans["FREE"]["price_monthly"] == 0
    assert plans["BASIC"]["price_monthly"] == 990
    assert plans["BASIC"]["price_yearly"] == 9900
    assert plans["PRO"]["price_monthly"] == 1990
    assert plans["PRO"]["price_yearly"] == 19900

    expected = {
        ("basic", "month"): "990.00",
        ("basic", "year"): "9900.00",
        ("pro", "month"): "1990.00",
        ("pro", "year"): "19900.00",
    }
    for (plan_code, cycle), amount in expected.items():
        fields = _checkout(client, headers, plan_code, cycle)
        assert fields["currency"] == "LKR"
        assert fields["amount"] == amount


def test_payhere_rejects_invalid_notification_signature(client, register_and_login, monkeypatch):
    _enable(monkeypatch)
    fields = _checkout(client, register_and_login())
    payload = _notification(fields)
    payload["md5sig"] = "BAD"
    assert client.post("/api/subscriptions/payhere/notify", data=payload).status_code == 422


def test_payhere_success_activates_and_records_payment(client, register_and_login, monkeypatch):
    _enable(monkeypatch)
    headers = register_and_login()
    fields = _checkout(client, headers)
    assert client.post("/api/subscriptions/payhere/notify", data=_notification(fields)).status_code == 200
    status = client.get(f"/api/subscriptions/payhere/orders/{fields['order_id']}", headers=headers).json()["data"]
    assert status["subscription_active"] is True
    payments = client.get("/api/billing/payments", headers=headers).json()["data"]["items"]
    assert payments[0]["status"] == "PAID"
    assert payments[0]["payment_method"] == "VISA"


def test_payhere_failed_payment_does_not_upgrade(client, register_and_login, monkeypatch):
    _enable(monkeypatch)
    headers = register_and_login()
    fields = _checkout(client, headers)
    assert client.post("/api/subscriptions/payhere/notify", data=_notification(fields, "-2")).status_code == 200
    status = client.get(f"/api/subscriptions/payhere/orders/{fields['order_id']}", headers=headers).json()["data"]
    assert status == {"order_id": fields["order_id"], "payment_status": "failed", "subscription_active": False}


def test_payhere_duplicate_notification_is_idempotent(client, register_and_login, monkeypatch):
    _enable(monkeypatch)
    headers = register_and_login()
    fields = _checkout(client, headers)
    payload = _notification(fields)
    assert client.post("/api/subscriptions/payhere/notify", data=payload).status_code == 200
    assert client.post("/api/subscriptions/payhere/notify", data=payload).status_code == 200
    assert len(client.get("/api/billing/invoices", headers=headers).json()["data"]["items"]) == 1


def test_payhere_routes_require_authentication(client):
    assert client.post("/api/subscriptions/payhere/checkout", json={}).status_code == 401
    assert client.get("/api/subscriptions/payhere/orders/not-mine").status_code == 401
    assert client.get("/api/billing/payments").status_code == 401
