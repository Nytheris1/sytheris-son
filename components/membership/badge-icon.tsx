import {
  Award,
  Bell,
  Brush,
  Castle,
  Cat,
  Cloud,
  Coffee,
  Dumbbell,
  Eye,
  Infinity as InfinityIcon,
  Leaf,
  Orbit,
  Pencil,
  ScrollText,
  Soup,
  Sparkle,
  Telescope,
  Zap,
  BadgeCheck,
  BookOpen,
  Bot,
  Bug,
  CalendarCheck,
  CalendarHeart,
  Candy,
  Captions,
  Cherry,
  Clapperboard,
  Crown,
  DoorOpen,
  Film,
  Flame,
  FlaskConical,
  Flower2,
  Footprints,
  Gamepad2,
  Gavel,
  Gem,
  Ghost,
  GraduationCap,
  HandHeart,
  Handshake,
  Heart,
  Hourglass,
  Languages,
  LibraryBig,
  Medal,
  MessageSquareQuote,
  Mic2,
  MoonStar,
  Music,
  Palette,
  PartyPopper,
  PenTool,
  Popcorn,
  Rocket,
  Shield,
  Skull,
  Sparkles,
  Star,
  Swords,
  Timer,
  Trophy,
  Users,
  VenetianMask,
  Aperture,
  Armchair,
  Atom,
  Binoculars,
  Camera,
  Clock,
  Dice5,
  Disc3,
  Eclipse,
  Feather,
  Fingerprint,
  Gift,
  Glasses,
  Headphones,
  HeartCrack,
  Highlighter,
  Images,
  Key,
  Layers,
  ListVideo,
  Lock,
  Map as MapIcon,
  Megaphone,
  Mountain,
  Pin,
  Projector,
  Puzzle,
  Shuffle,
  Siren,
  Snowflake,
  Sun,
  Sunrise,
  Theater,
  Ticket,
  Video,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import { BADGES, RARITY, sortBadges, type BadgeId } from '@/lib/membership'
import { cn } from '@/lib/utils'

const ICONS: Record<BadgeId, LucideIcon> = {
  legend: Medal,
  syraHeart: Heart,
  founder: Crown,
  ultra: Gem,
  partner: Handshake,
  champion: Trophy,
  staff: Shield,
  moderator: Gavel,
  verified: BadgeCheck,
  marathon: Timer,
  veteran: Hourglass,
  midnight: Film,
  streak30: CalendarHeart,
  mangaka: PenTool,
  translator: Languages,
  bughunter: Bug,
  halloween: Skull,
  newyear: PartyPopper,
  plus: Sparkles,
  early: Rocket,
  otaku: Flame,
  critic: MessageSquareQuote,
  collector: LibraryBig,
  curator: Star,
  sakura: Flower2,
  beta: FlaskConical,
  senpai: GraduationCap,
  streak7: CalendarCheck,
  artist: Palette,
  cosplay: VenetianMask,
  subber: Captions,
  supporter: HandHeart,
  cinephile: Clapperboard,
  firstStep: Footprints,
  bard: Music,
  night: MoonStar,
  isekai: DoorOpen,
  mecha: Bot,
  idol: Mic2,
  samurai: Swords,
  nakama: Users,
  spirit: Ghost,
  tsundere: Cherry,
  gamer: Gamepad2,
  bookworm: BookOpen,
  popcorn: Popcorn,
  kawaii: Candy,
  eternal: InfinityIcon,
  masterpiece: Award,
  shogun: Castle,
  painter: Brush,
  nightWatch: Eye,
  oracle: Orbit,
  speedrun: Zap,
  matcha: Coffee,
  sketcher: Pencil,
  shrine: Bell,
  spiritGarden: Leaf,
  sensei: ScrollText,
  ramen: Soup,
  neko: Cat,
  shonen: Dumbbell,
  shojo: Sparkle,
  dreamer: Cloud,
  stargazer: Telescope,
  cineLegend: Clapperboard,
  goldenReel: Disc3,
  awardNight: Theater,
  gift: Gift,
  nightShift: Eclipse,
  seriesBinger: ListVideo,
  directorsCut: Video,
  plotTwist: Shuffle,
  screamQueen: Siren,
  criticChoice: Highlighter,
  puzzleMaster: Puzzle,
  lucky: Dice5,
  projectionist: Projector,
  ticketStub: Ticket,
  cliffhanger: Mountain,
  spoilerShield: Lock,
  glasses3d: Glasses,
  finalGirl: Key,
  pinCollector: Pin,
  galleryCurator: Layers,
  aperture: Aperture,
  snowfall: Snowflake,
  explorer: MapIcon,
  dj: Headphones,
  frontRow: Armchair,
  detective: Fingerprint,
  spaceCadet: Atom,
  cowboy: Sun,
  documentarian: Binoculars,
  creditRoller: Clock,
  moodboard: Images,
  photographer: Camera,
  earlyBird: Sunrise,
  wizard: WandSparkles,
  poet: Feather,
  heartbreak: HeartCrack,
  herald: Megaphone,
}

const SIZE = { xs: '1.125rem', sm: '1.625rem', md: '2.5rem', lg: '3.5rem', xl: '4.5rem' } as const
type Size = keyof typeof SIZE

export function BadgeIcon({
  id,
  size = 'sm',
  showLabel = false,
  locked = false,
  tip = true,
  className,
}: {
  id: BadgeId
  size?: Size
  showLabel?: boolean
  locked?: boolean
  tip?: boolean
  className?: string
}) {
  const def = BADGES[id]
  if (!def) return null
  const Icon = ICONS[id]
  const rarity = RARITY[def.rarity]
  return (
    <span
      className={cn('group/badge relative inline-flex items-center gap-2 outline-none', className)}
      tabIndex={tip ? 0 : undefined}
      aria-label={`${def.name} rozeti, ${rarity.label}: ${def.description}`}
      role="img"
    >
      <span className={cn('bx', `bx-${def.rarity}`, locked && 'bx-locked')} style={{ '--bh': def.hue, '--bx-size': SIZE[size] } as React.CSSProperties}>
        <span className="bx-shape">
          <span className="bx-core">
            <Icon aria-hidden="true" />
          </span>
        </span>
        {def.rarity === 'mythic' && size !== 'xs' && !locked && (
          <>
            <span className="bx-spark" aria-hidden="true" />
            <span className="bx-spark" aria-hidden="true" />
          </>
        )}
      </span>
      {showLabel && <span className="text-sm font-medium">{def.name}</span>}
      {tip && (
        <span className="bx-tip" style={{ '--bh': def.hue } as React.CSSProperties} aria-hidden="true">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: `oklch(0.82 0.14 ${def.hue})` }}>
            {rarity.label}
          </span>
          <span className="text-[13px] font-semibold leading-tight">{def.name}</span>
          <span className="text-[11px] leading-snug opacity-70">{def.description}</span>
        </span>
      )}
    </span>
  )
}

export function BadgeRow({ ids, size = 'sm', max = 8, className }: { ids: BadgeId[]; size?: Size; max?: number; className?: string }) {
  const sorted = sortBadges(ids)
  if (!sorted.length) return null
  const shown = sorted.slice(0, max)
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {shown.map((b) => (
        <BadgeIcon key={b} id={b} size={size} />
      ))}
      {sorted.length > max && <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">+{sorted.length - max}</span>}
    </span>
  )
}
