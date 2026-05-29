import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../components/Sidebar'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '₹0',
    features: ['1 team member', '10k API calls/mo', 'Community support'],
    color: '#888',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₹49',
    features: ['5 team members', '100k API calls/mo', 'Priority support', 'Analytics'],
    color: '#89b4fa',
    popular: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '₹99',
    features: ['Unlimited members', 'Unlimited API calls', '24/7 support', 'Custom integrations'],
    color: '#a6e3a1',
  },
]

export default function Billing() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const org  = JSON.parse(localStorage.getItem('org'))
  const user  = JSON.parse(localStorage.getItem('user'))

  const [subscription, setSubscription] = useState(null)
  const [message, setMessage]  = useState('')
  const [error, setError]  = useState('')
  const [loading, setLoading]  = useState(false)

  const fetchSubscription = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/billing/subscription', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscription(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    // load Razorpay script
    const script = document.createElement('script')
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
    fetchSubscription()
  }, [])

  const handleUpgrade = async (planKey) => {
    setLoading(true)
    setMessage('')
    setError('')
    try {
      //  create order on server
      const orderRes = await axios.post(
        'http://localhost:5000/api/billing/create-order',
        { plan: planKey },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { orderId, amount, currency, keyId, plan } = orderRes.data

      // open Razorpay checkout popup
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SaaS Dashboard',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        order_id: orderId,
        prefill: {
          name:  user?.name,
          email: user?.email,
        },
        theme: { color: '#89b4fa' },

        // after payment, verify on server
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              'http://localhost:5000/api/billing/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            setMessage(verifyRes.data.message)
            fetchSubscription()
          } catch (err) {
            setError('Payment verification failed. Contact support.')
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel subscription? You will go back to the free plan.')) return
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/billing/cancel', {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      fetchSubscription()
    } catch (err) {
      setError('Could not cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = subscription?.plan || 'free'

  return (
    <Sidebar />
  )
}