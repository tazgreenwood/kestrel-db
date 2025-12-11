import { useState, useEffect } from 'react'
import { X, Check, Eye, EyeOff } from 'lucide-react'
import {
  useConnectionsStore,
  type SavedConnection,
  type ConnectionColor
} from '../../store/useConnectionsStore'

interface SaveConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  editConnection?: SavedConnection | null // If provided, we're editing
}

const COLOR_OPTIONS: Array<{ value: ConnectionColor; bg: string; border: string; hex: string }> = [
  { value: 'red', bg: 'bg-red-500/20', border: 'border-red-500', hex: '#ef4444' },
  { value: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500', hex: '#f97316' },
  { value: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500', hex: '#eab308' },
  { value: 'green', bg: 'bg-green-500/20', border: 'border-green-500', hex: '#22c55e' },
  { value: 'cyan', bg: 'bg-cyan-500/20', border: 'border-cyan-500', hex: '#06b6d4' },
  { value: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500', hex: '#3b82f6' },
  { value: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500', hex: '#a855f7' },
  { value: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500', hex: '#ec4899' },
  { value: 'gray', bg: 'bg-gray-500/20', border: 'border-gray-500', hex: '#6b7280' }
]

export function SaveConnectionModal({ isOpen, onClose, editConnection }: SaveConnectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const saveConnection = useConnectionsStore((state) => state.saveConnection)
  const getConnection = useConnectionsStore((state) => state.getConnection)

  const [form, setForm] = useState({
    name: '',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    color: 'gray' as ConnectionColor,
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')

  // Load connection data if editing, or reset form for new
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setForm({
        name: '',
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        color: 'gray',
        tags: []
      })
      setTagInput('')
      setError(null)
      setTested(false)
      setShowPassword(false)
      return
    }

    if (editConnection) {
      const loadConnection = async () => {
        try {
          const fullConn = await getConnection(editConnection.id)
          setForm({
            name: fullConn.name,
            host: fullConn.host,
            port: fullConn.port,
            user: fullConn.user,
            password: fullConn.password || '',
            color: fullConn.color || 'gray',
            tags: fullConn.tags || []
          })
        } catch (err) {
          setError('Failed to load connection')
        }
      }
      loadConnection()
    } else {
      // Reset form for new connection
      setForm({
        name: '',
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        color: 'gray',
        tags: []
      })
    }
  }, [isOpen, editConnection, getConnection])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Escape: Close modal
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm({ ...form, tags: [...form.tags, trimmed] })
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(tagInput)
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault()
      handleAddTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      setForm({ ...form, tags: form.tags.slice(0, -1) })
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setError(null)
    setTested(false)

    try {
      const result = await window.api.db.testConnection({
        host: form.host,
        user: form.user,
        password: form.password,
        port: Number(form.port)
      })

      if (result.success) {
        setTested(true)
      } else {
        setError(result.error || 'Connection test failed')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate name and password
      if (!form.name.trim()) {
        setError('Connection name is required')
        setLoading(false)
        return
      }

      if (!form.password) {
        setError('Password is required')
        setLoading(false)
        return
      }

      // Save connection
      await saveConnection(
        {
          name: form.name.trim(),
          host: form.host,
          user: form.user,
          port: Number(form.port),
          color: form.color,
          tags: form.tags.length > 0 ? form.tags : undefined
        },
        form.password
      )

      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-overlay">
      <div className="bg-secondary border border-default rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-default">
          <h2 className="text-lg font-semibold text-primary">
            {editConnection ? 'Edit Connection' : 'Save Connection'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-tertiary rounded transition-colors">
            <X className="w-4 h-4 text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Connection Name */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Connection Name *
            </label>
            <input
              type="text"
              placeholder="Production, Staging, Local Dev..."
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value })
              }}
              className="w-full px-3 py-2 rounded bg-tertiary border border-default text-white placeholder-tertiary text-sm focus:border-accent focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: option.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    form.color === option.value
                      ? 'ring-2 ring-accent/30 border-white/50'
                      : 'border-default hover:border-accent/50'
                  }`}
                  style={{ backgroundColor: option.hex }}
                >
                  {form.color === option.value && (
                    <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Tags <span className="text-tertiary font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded bg-tertiary border border-default focus-within:border-accent transition-colors min-h-[42px]">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 border border-accent/30 rounded text-xs text-accent"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-accent/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={
                  form.tags.length === 0
                    ? 'Add tags (production, staging, analytics...)'
                    : 'Add tag...'
                }
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) {
                    handleAddTag(tagInput)
                  }
                }}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white text-sm placeholder-tertiary"
              />
            </div>
            <p className="text-xs text-tertiary mt-1">
              Press Enter, Space, or Comma to add. Backspace to remove.
            </p>
          </div>

          {/* Host and Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-secondary mb-1.5">Host *</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => {
                  setForm({ ...form, host: e.target.value })
                  setTested(false)
                }}
                className="w-full px-3 py-2 rounded bg-tertiary border border-default text-white text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Port *</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => {
                  setForm({ ...form, port: Number(e.target.value) })
                  setTested(false)
                }}
                className="w-full px-3 py-2 rounded bg-tertiary border border-default text-white text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* User */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">User *</label>
            <input
              type="text"
              value={form.user}
              onChange={(e) => {
                setForm({ ...form, user: e.target.value })
                setTested(false)
              }}
              className="w-full px-3 py-2 rounded bg-tertiary border border-default text-white text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value })
                  setTested(false)
                }}
                className="w-full px-3 py-2 pr-10 rounded bg-tertiary border border-default text-white text-sm focus:border-accent focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-secondary transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="text-error text-xs bg-error/10 p-3 rounded border border-error/20">
              {error}
            </div>
          )}
          {tested && !error && (
            <div className="text-green-400 text-xs bg-green-500/10 p-3 rounded border border-green-500/20 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Connection successful
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-tertiary hover:bg-tertiary/80 text-secondary text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || loading || !form.password}
              className="px-4 py-2 rounded bg-secondary hover:bg-tertiary disabled:bg-tertiary disabled:text-tertiary border border-default text-primary text-sm font-medium transition-colors"
            >
              {testing ? 'Testing...' : 'Test'}
            </button>
            <button
              type="submit"
              disabled={loading || testing}
              className="flex-1 px-4 py-2 rounded bg-accent hover:bg-accent/90 disabled:bg-tertiary disabled:text-secondary text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : editConnection ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
