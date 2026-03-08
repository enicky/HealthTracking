import { useState } from 'react'
import EcgList from './EcgList'
import EcgDetail from './EcgDetail'

export default function EcgPage() {
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId)
  }

  const handleBack = () => {
    setSelectedSessionId(null)
  }

  if (selectedSessionId) {
    return <EcgDetail sessionId={selectedSessionId} onBack={handleBack} />
  }

  return <EcgList onSelectSession={handleSelectSession} />
}
