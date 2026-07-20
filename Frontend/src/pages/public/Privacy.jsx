import Badge from '../../components/common/Badge'

const SECTIONS = [
  ['Information we collect', 'We collect the information you provide directly (resume content, profile details, interview responses) and basic usage data needed to operate the platform.'],
  ['How we use your data', 'Your resume and interview data are used only to generate your personal feedback, scores, and recommendations — never sold to third parties.'],
  ['Data storage', 'Data is stored securely and retained only as long as needed to provide the service, or until you request deletion.'],
  ['Your rights', 'You can export or delete your account data at any time from Settings → Privacy.'],
  ['AI processing', 'Resume and interview analysis is performed by automated AI systems. Results are estimates intended to help you improve, not verified professional assessments.'],
  ['Contact', 'Questions about this policy can be sent via the Contact page.'],
]

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <Badge tone="blue">Legal</Badge>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mt-4">Privacy Policy</h1>
      <p className="text-sm text-text-muted mt-2">Last updated: July 19, 2026 — this is placeholder policy text for a student project, not legal advice.</p>
      <div className="mt-10 space-y-8">
        {SECTIONS.map(([title, body]) => (
          <div key={title}>
            <h2 className="font-display font-semibold text-text-primary text-lg mb-2">{title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
