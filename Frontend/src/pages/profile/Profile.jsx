import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, Trash2, Pencil, Save, X } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Textarea from '../../components/common/Textarea'
import MultiSelect from '../../components/common/MultiSelect'
import CircularProgress from '../../components/common/CircularProgress'
import { useAuth } from '../../hooks/useAuth'
import { JOB_ROLES, STUDY_LEVELS } from '../../utils/constants'
import * as userService from '../../services/userService'
import * as interviewService from '../../services/interviewService'
import * as resumeService from '../../services/resumeService'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(user)
  const [counts, setCounts] = useState({ interviews: 0, resumes: 0 })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const fileInputRef = useRef(null)

  function replaceAvatarUrl(nextUrl) {
    setAvatarUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return nextUrl
    })
  }

  useEffect(() => {
    Promise.all([userService.getProfile(), interviewService.getInterviewHistory(), resumeService.getResumeHistory()])
      .then(([profile, interviews, resumes]) => {
        const merged = { ...user, ...profile }
        setForm(merged)
        updateUser(profile)
        setCounts({ interviews: interviews.length, resumes: resumes.length })
        if (profile.avatarPath) {
          userService.getProfileImage().then(replaceAvatarUrl).catch(() => replaceAvatarUrl(null))
        }
      })
    return () => setAvatarUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return null
    })
  }, [])

  async function changeProfileImage(event) {
    const image = event.target.files?.[0]
    event.target.value = ''
    if (!image) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      toast.error('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (image.size > 5 * 1024 * 1024) {
      toast.error('Profile image must be 5 MB or smaller.')
      return
    }
    setAvatarBusy(true)
    try {
      const profile = await userService.uploadProfileImage(image)
      const imageUrl = await userService.getProfileImage()
      replaceAvatarUrl(imageUrl)
      updateUser(profile)
      toast.success('Profile picture updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to upload the profile picture.')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function removeProfileImage() {
    if (!avatarUrl && !user?.avatarPath) {
      toast.error('There is no profile picture to remove.')
      return
    }
    setAvatarBusy(true)
    try {
      const profile = await userService.deleteProfileImage()
      replaceAvatarUrl(null)
      updateUser(profile)
      toast.success('Profile picture removed.')
    } catch (error) {
      toast.error(error.message || 'Unable to remove the profile picture.')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function save() {
    const updated = await userService.updateProfile(form)
    updateUser(updated)
    setEditing(false)
    toast.success('Profile updated')
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your personal information and career preferences." />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="text-center h-fit">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue to-cyan flex items-center justify-center overflow-hidden text-2xl font-display font-bold text-black">
              {avatarUrl ? <img src={avatarUrl} alt={`${user?.fullName || 'User'} profile`} className="w-full h-full object-cover" /> : user?.fullName?.[0]}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changeProfileImage} />
            <button disabled={avatarBusy} aria-label="Upload or replace profile picture" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-app-2 border border-border flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-50"><Camera size={14} /></button>
          </div>
          <h3 className="font-display font-semibold text-text-primary mt-4">{user?.fullName}</h3>
          <p className="text-xs text-text-muted mt-0.5">{user?.targetCareer}</p>
          <div className="flex justify-center mt-4"><CircularProgress value={user?.readinessScore || 0} size={72} label="ready" /></div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" fullWidth className="!text-xs !py-2" onClick={() => setEditing((e) => !e)}>{editing ? 'Cancel' : 'Edit profile'}</Button>
            <Button variant="ghost" loading={avatarBusy} disabled={!avatarUrl && !user?.avatarPath} aria-label="Remove profile picture" className="!text-xs !py-2 !px-3" onClick={removeProfileImage}><Trash2 size={14} /></Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-text-primary text-sm">Personal information</h3>
              {editing ? (
                <div className="flex gap-2"><Button variant="ghost" icon={X} className="!text-xs !py-1.5" onClick={() => { setForm(user); setEditing(false) }}>Cancel</Button><Button icon={Save} className="!text-xs !py-1.5" onClick={save}>Save</Button></div>
              ) : (
                <Button variant="ghost" icon={Pencil} className="!text-xs !py-1.5" onClick={() => setEditing(true)}>Edit</Button>
              )}
            </div>
            {editing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
                <Input label="Institute" value={form.institute} onChange={(e) => setForm({ ...form, institute: e.target.value })} />
                <Select label="Study level" options={STUDY_LEVELS} value={form.studyLevel} onChange={(e) => setForm({ ...form, studyLevel: e.target.value })} />
                <Select label="Target career" options={JOB_ROLES} value={form.targetCareer} onChange={(e) => setForm({ ...form, targetCareer: e.target.value })} />
                <div className="sm:col-span-2"><MultiSelect label="Skills" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} /></div>
                <div className="sm:col-span-2"><Textarea label="Short bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-text-muted text-xs">Email</p><p className="text-text-secondary mt-0.5">{user?.email}</p></div>
                <div><p className="text-text-muted text-xs">Education</p><p className="text-text-secondary mt-0.5">{user?.degree}, {user?.institute}</p></div>
                <div><p className="text-text-muted text-xs">Study level</p><p className="text-text-secondary mt-0.5">{user?.studyLevel}</p></div>
                <div className="sm:col-span-2"><p className="text-text-muted text-xs">Bio</p><p className="text-text-secondary mt-0.5">{user?.bio}</p></div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">{user?.skills?.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}</div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-5">
            <Card><h3 className="font-display font-semibold text-text-primary text-sm mb-2">Interview history</h3><p className="text-2xl font-display font-bold text-text-primary">{counts.interviews}</p><p className="text-xs text-text-muted">sessions completed</p></Card>
            <Card><h3 className="font-display font-semibold text-text-primary text-sm mb-2">Resume history</h3><p className="text-2xl font-display font-bold text-text-primary">{counts.resumes}</p><p className="text-xs text-text-muted">analyses on file</p></Card>
          </div>
        </div>
      </div>
    </div>
  )
}
