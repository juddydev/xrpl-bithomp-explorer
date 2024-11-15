import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { appWithTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import { GoogleAnalytics } from '@next/third-parties/google'

import Header from '../components/Layout/Header'
import Footer from '../components/Layout/Footer'
import SignForm from '../components/SignForm'
import ScrollToTop from '../components/Layout/ScrollToTop'
import BackgroundImage from '../components/Layout/BackgroundImage'

const TopLinks = dynamic(() => import('../components/Layout/TopLinks'), { ssr: false })
const TopProgressBar = dynamic(() => import('../components/TopProgressBar'), { ssr: false })

import { IsSsrMobileContext } from '../utils/mobile'
import { isValidUUID, network, server, useLocalStorage, useCookie, xahauNetwork } from '../utils'

import '../styles/ui.scss'
import '../styles/components/nprogress.css'

import { ThemeProvider } from '../components/Layout/ThemeContext'

const MyApp = ({ Component, pageProps }) => {
  const [account, setAccount] = useLocalStorage('account')
  const [sessionToken, setSessionToken] = useLocalStorage('sessionToken')
  const [selectedCurrency, setSelectedCurrency] = useCookie('currency', 'usd')
  const [proExpire, setProExpire] = useCookie('pro-expire')
  const [subscriptionExpired, setSubscriptionExpired] = useState(
    proExpire ? Number(proExpire) < new Date().getTime() : true
  )
  const [signRequest, setSignRequest] = useState(false)
  const [refreshPage, setRefreshPage] = useState('')

  const router = useRouter()

  useEffect(() => {
    setSubscriptionExpired(proExpire ? Number(proExpire) < new Date().getTime() : true)
  }, [proExpire])

  useEffect(() => {
    if (sessionToken) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + sessionToken?.replace(/['"]+/g, '')
    }
  }, [sessionToken])

  const { uuid } = router.query

  const signOut = () => {
    localStorage.removeItem('xamanUserToken')
    setAccount({
      ...account,
      address: null,
      username: null,
      wallet: null
    })
  }

  const signOutPro = () => {
    setSessionToken('')
    setProExpire('0')
    setAccount({
      ...account,
      pro: null
    })
  }

  const saveAddressData = async ({ address, wallet }) => {
    //&service=true&verifiedDomain=true&blacklist=true&payString=true&twitterImageUrl=true&nickname=true
    const response = await axios('v2/address/' + address + '?username=true')
    if (response.data) {
      const { username } = response.data
      setAccount({ ...account, address, username, wallet })
    } else {
      setAccount({
        ...account,
        address: null,
        username: null,
        wallet: null
      })
    }
  }

  if (process.env.NODE_ENV === 'development') {
    axios.defaults.headers.common['x-bithomp-token'] = process.env.NEXT_PUBLIC_BITHOMP_API_TEST_KEY
    axios.defaults.baseURL = server + '/api/'
  } else {
    axios.defaults.baseURL = server + '/api/cors/'
  }

  const pathname = router.pathname
  const pagesWithoutWrapper = ['/social-share']

  const showAds = subscriptionExpired && !xahauNetwork
  let showTopAds = false //showAds // change here when you want to see TOP ADS
  const pagesWithNoTopAdds = [
    '/',
    '/username',
    '/eaas',
    '/build-unl',
    '/disclaimer',
    '/privacy-policy',
    '/terms-and-conditions',
    '/press',
    '/404'
  ]
  if (showTopAds) {
    showTopAds = !pagesWithNoTopAdds.includes(pathname) && !pathname.includes('/admin')
  }

  if (pagesWithoutWrapper.includes(pathname)) {
    return <Component />
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charSet="utf-8" />
      </Head>
      <IsSsrMobileContext.Provider value={pageProps.isSsrMobile}>
        <ThemeProvider>
          <div className="body" data-network={network}>
            <Header
              setSignRequest={setSignRequest}
              account={account}
              signOut={signOut}
              signOutPro={signOutPro}
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
            />
            <ScrollToTop />
            {(signRequest || isValidUUID(uuid)) && (
              <SignForm
                setSignRequest={setSignRequest}
                account={account}
                setAccount={setAccount}
                signRequest={signRequest}
                uuid={uuid}
                setRefreshPage={setRefreshPage}
                saveAddressData={saveAddressData}
              />
            )}
            <div className="content">
              <TopProgressBar />
              {showTopAds && <TopLinks />}
              <Component
                {...pageProps}
                refreshPage={refreshPage}
                setSignRequest={setSignRequest}
                account={account}
                setAccount={setAccount}
                signOut={signOut}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                showAds={showAds}
                setProExpire={setProExpire}
                signOutPro={signOutPro}
                subscriptionExpired={subscriptionExpired}
                sessionToken={sessionToken}
                setSessionToken={setSessionToken}
              />
            </div>
            <BackgroundImage />
            <Footer setSignRequest={setSignRequest} account={account} />
          </div>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </IsSsrMobileContext.Provider>
    </>
  )
}

export default appWithTranslation(MyApp)
