'use client'

import { Component, type ReactNode } from 'react'

/** Drops a single 3D object (e.g. a cover whose texture 404s) instead of taking the whole canvas down. */
export class QuietBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
