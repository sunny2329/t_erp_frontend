import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import clsx from 'clsx'
import { Input } from './Input'

// Free, keyless place search backed by Komoot's public Photon instance (OSM
// data) — see AddressAutocomplete usage notes. No API key/billing needed,
// but it's a shared public instance with no uptime SLA, so failures are
// swallowed silently (the field just behaves like a plain text input).
const PHOTON_URL = 'https://photon.komoot.io/api/'
const DEBOUNCE_MS = 350
const MIN_QUERY_LENGTH = 3

function formatLabel(props) {
  const line1 = [props.housenumber, props.street].filter(Boolean).join(' ') || props.name || ''
  const rest = [props.city || props.town || props.village, props.state, props.country].filter(Boolean)
  return [line1, ...rest].filter(Boolean).join(', ')
}

// Photon's `type` marks how granular a result is — a "house"/"street" result
// carries a real street address plus city/state/postcode as separate fields,
// but a "city"/"state"/"country"-level result (e.g. the user just typed a
// city name and picked the top match) has none of that: the city's own name
// only shows up in `properties.name`, not `properties.city`. Likewise a
// postcode search's code lives in `name`, not `postcode`. Without handling
// these, picking anything but a full street address left city/zip blank.
function toPlace(feature) {
  const p = feature.properties || {}
  const [lon, lat] = feature.geometry?.coordinates || []
  const streetAddress = [p.housenumber, p.street].filter(Boolean).join(' ')
  const isPlaceLevel = ['city', 'town', 'village', 'county', 'state', 'country'].includes(p.type)
  const isPostcode = p.type === 'other' && p.osm_value === 'postcode'

  return {
    label: formatLabel(p),
    address: streetAddress || (isPlaceLevel || isPostcode ? '' : p.name || ''),
    city: p.city || p.town || p.village || (['city', 'town', 'village'].includes(p.type) ? p.name : '') || '',
    state: p.state || (p.type === 'state' ? p.name : '') || '',
    zipCode: p.postcode || (isPostcode ? p.name : '') || '',
    country: p.country || (p.type === 'country' ? p.name : '') || '',
    lat,
    lon,
  }
}

// Controlled free-text input (value/onChange, like Input) that shows a
// place-suggestion dropdown as the user types and calls onSelect(place) with
// { address, city, state, zipCode, country, lat, lon } when one is picked —
// callers use onSelect to autofill their other address fields.
export function AddressAutocomplete({ value, onChange, onSelect, placeholder, error, disabled, className }) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const skipNextSearchRef = useRef(false)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }

    const query = (value || '').trim()
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=6&lang=en`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('geocode lookup failed')
        const data = await res.json()
        setResults((data.features || []).map(toPlace))
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          error={error}
          disabled={disabled}
          className={clsx('pr-8', className)}
          autoComplete="off"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
        </span>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="scrollbar-thin max-h-64 overflow-y-auto py-1">
            {results.map((place, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  skipNextSearchRef.current = true
                  onSelect(place)
                  setOpen(false)
                  setResults([])
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{place.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
