import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './FooterNav.module.css'

type FooterNavProps = {
  schedulingEnabled: boolean
}

type FooterIconProps = {
  iconClassName: string
}

const FooterIcon = memo(function FooterIcon({ iconClassName }: Readonly<FooterIconProps>) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.icon} ${iconClassName}`}
    />
  )
})

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
}

export const FooterNav = memo(function FooterNav({ schedulingEnabled }: Readonly<FooterNavProps>) {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={navLinkClass}
          end
          aria-label="Home"
          title="Home"
        >
          <FooterIcon iconClassName={styles.iconHome} />
        </NavLink>
        {schedulingEnabled ? (
          <NavLink
            to="/scheduling"
            className={navLinkClass}
            aria-label="Scheduling"
            title="Scheduling"
          >
            <FooterIcon iconClassName={styles.iconCalendar} />
          </NavLink>
        ) : (
          <span
            className={`${styles.navLink} ${styles.navLinkDisabled}`}
            aria-label="Scheduling (not available)"
            title="Scheduling (not available)"
            aria-disabled="true"
          >
            <FooterIcon iconClassName={styles.iconCalendar} />
          </span>
        )}
        <NavLink
          to="/webhooks"
          className={navLinkClass}
          aria-label="Webhooks"
          title="Webhooks"
        >
          <FooterIcon iconClassName={styles.iconBell} />
        </NavLink>
      </nav>
    </footer>
  )
})
