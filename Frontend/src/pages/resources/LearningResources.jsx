import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import Select from '../../components/common/Select'
import ResourceCard from '../../components/resources/ResourceCard'
import EmptyState from '../../components/common/EmptyState'
import SkeletonLoader from '../../components/common/SkeletonLoader'
import * as resourceService from '../../services/resourceService'

const TYPES = ['Course', 'Article', 'Video', 'Documentation', 'Coding Exercise', 'Interview Questions']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export default function LearningResources() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [difficulty, setDifficulty] = useState('')

  useEffect(() => { resourceService.getResources().then((d) => { setItems(d); setLoading(false) }) }, [])

  function toggleBookmark(id) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, bookmarked: !r.bookmarked } : r)))
  }

  const filtered = items.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) &&
    (!type || r.type === type) &&
    (!difficulty || r.difficulty === difficulty)
  )

  return (
    <div>
      <PageHeader title="Learning Resources" subtitle="Courses, articles, and exercises matched to your skill gaps." />

      <div className="flex flex-wrap gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search resources..." className="max-w-xs" />
        <Select options={TYPES} value={type} onChange={(e) => setType(e.target.value)} placeholder="All types" containerClassName="w-44" />
        <Select options={DIFFICULTIES} value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="All difficulty" containerClassName="w-44" />
      </div>

      {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No resources found" message="Try a different search or filter." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => <ResourceCard key={r.id} resource={r} onBookmark={toggleBookmark} />)}
        </div>
      )}
    </div>
  )
}
