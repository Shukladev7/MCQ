import logoSrc from '../assets/logo.png'

const sizes = {
  xs: { img:28, title:'text-xs',  sub:'text-[10px]', gap:'gap-2'   },
  sm: { img:34, title:'text-sm',  sub:'text-[10px]', gap:'gap-2.5' },
  md: { img:44, title:'text-base',sub:'text-xs',     gap:'gap-3'   },
  lg: { img:60, title:'text-xl',  sub:'text-xs',     gap:'gap-3'   },
  xl: { img:80, title:'text-2xl', sub:'text-sm',     gap:'gap-4'   },
}

export default function VisionLogo({ size = 'md', showText = true, className = '' }) {
  const s = sizes[size] || sizes.md
  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <img src={logoSrc} alt="Vision CSE" width={s.img} height={s.img}
        className="object-contain flex-shrink-0 select-none"
        draggable={false} />
      {showText && (
        <div className="flex flex-col leading-none select-none">
          <span className={`font-bold tracking-tight text-white ${s.title}`}
            style={{ fontFamily:'Inter,sans-serif', letterSpacing:'-0.02em' }}>
            Vision CSE
          </span>
          <span className={`text-t2 font-medium tracking-wide ${s.sub}`}
            style={{ fontFamily:'Inter,sans-serif' }}>
            Recruitment Portal
          </span>
        </div>
      )}
    </div>
  )
}