import React, { type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    // Log error for monitoring in production
    console.error('ErrorBoundary caught an error:', error)
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error)
      }

      return (
        <div className={styles.container}>
          <h2 className={styles.title}>Something went wrong</h2>
          <details className={styles.details}>
            {this.state.error.toString()}
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
