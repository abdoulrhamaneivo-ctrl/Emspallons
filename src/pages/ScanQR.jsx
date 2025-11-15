import ControllerScanner from '../components/scanner/ControllerScanner'
import ScannerMobile from '../components/scanner/ScannerMobile'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function ScanQR() {
  const { isMobile } = useBreakpoint()

  if (isMobile) {
    return (
      <ScannerMobile>
        <ControllerScanner />
      </ScannerMobile>
    )
  }

  return (
    <div className="min-h-screen">
      <ControllerScanner />
    </div>
  )
}
