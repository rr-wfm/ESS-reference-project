import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './FooterNav.module.css'

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

export const FooterNav = memo(function FooterNav() {
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
        <NavLink
          to="/scheduling"
          className={navLinkClass}
          aria-label="Scheduling"
          title="Scheduling"
        >
          <FooterIcon iconClassName={styles.iconCalendar} />
        </NavLink>
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
