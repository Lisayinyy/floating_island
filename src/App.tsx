import IslandPortfolio from './interface/IslandPortfolio'
import { LocaleProvider } from './i18n'

export default function App() {
  return <LocaleProvider><IslandPortfolio /></LocaleProvider>
}
