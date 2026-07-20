import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, tone = 'coral', confirmLabel = 'Confirm' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={tone === 'coral' ? 'coral' : 'outline'} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }>
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  )
}
