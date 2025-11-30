import HomeControl from '@/components/home/HomeControl'
import { getLocale } from '@/lib/i18n-server'

export default async function Home() {
  const locale = await getLocale()

  return <HomeControl locale={locale} />
}
