import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import type { ResolvedHeaderMenuItem } from '@/lib/headerNavigation'
import { cn } from '@/lib/utils'

type HeaderNavMenuProps = {
  menuItems: ResolvedHeaderMenuItem[]
  size: 'compact' | 'default' | 'large'
}

const navListGapClasses = {
  compact: 'gap-1',
  default: 'gap-1',
  large: 'gap-1.5',
} as const

const triggerContainerClasses = {
  compact: 'h-7 px-2.5 py-0',
  default: 'h-[1.875rem] px-2.5 py-0',
  large: 'h-9 px-2.5 py-0',
} as const

const triggerLinkClasses = {
  compact: 'text-sm font-medium text-current',
  default: 'text-[0.9375rem] font-medium text-current',
  large: 'text-base font-medium text-current',
} as const

const dropdownContentClasses = {
  compact: 'left-0 min-w-56 p-1.5 md:w-56',
  default: 'left-0 min-w-60 p-1.5 md:w-60',
  large: 'left-0 min-w-64 p-2 md:w-64',
} as const

const childRowClasses = {
  compact: 'h-8 px-3 py-0 text-sm font-normal hover:bg-muted/80 focus:bg-muted/80',
  default: 'h-9 px-3.5 py-0 text-sm font-normal hover:bg-muted/80 focus:bg-muted/80',
  large: 'h-10 px-4 py-0 text-base font-normal hover:bg-muted/80 focus:bg-muted/80',
} as const

export function HeaderNavMenu({ menuItems, size }: HeaderNavMenuProps) {
  if (menuItems.length === 0) {
    return null
  }

  return (
    <nav aria-label="Primary navigation">
      <NavigationMenu className="max-w-none" viewport={false}>
        <NavigationMenuList className={navListGapClasses[size]}>
          {menuItems.map((item) => {
            const hasChildren = Boolean(item.children?.length)

            return (
              <NavigationMenuItem className="relative" key={`${item.label}-${item.href}`}>
                {hasChildren ? (
                  <>
                    <NavigationMenuTrigger className={triggerContainerClasses[size]}>
                      <span className={triggerLinkClasses[size]}>{item.label}</span>
                    </NavigationMenuTrigger>

                    <NavigationMenuContent className={dropdownContentClasses[size]}>
                      <ul className="flex flex-col gap-0.5">
                        {item.children?.map((child) => (
                          <li key={`${child.label}-${child.href}`}>
                            <NavigationMenuLink
                              className={childRowClasses[size]}
                              href={child.href}
                              rel={child.newTab ? 'noreferrer' : undefined}
                              target={child.newTab ? '_blank' : undefined}
                            >
                              <span className="truncate">{child.label}</span>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      triggerContainerClasses[size],
                      'py-0',
                    )}
                    href={item.href}
                    rel={item.newTab ? 'noreferrer' : undefined}
                    target={item.newTab ? '_blank' : undefined}
                  >
                    <span className={triggerLinkClasses[size]}>{item.label}</span>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
}
