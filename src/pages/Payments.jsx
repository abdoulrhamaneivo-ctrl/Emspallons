import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Plus, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(first_name, last_name, student_id)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des paiements')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-emsp-green">Paiements</h1>
          <button className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Nouveau paiement</span>
          </button>
        </div>

        {/* Summary Card */}
        <div className="card bg-gradient-to-r from-emsp-green to-emsp-green-light text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total ce mois</p>
              <p className="text-3xl font-bold">{totalAmount.toFixed(2)} €</p>
            </div>
            <DollarSign size={48} className="opacity-80" />
          </div>
        </div>

        {/* Payments List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emsp-yellow mx-auto"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun paiement enregistré
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-emsp-green">
                        {payment.students?.first_name}{' '}
                        {payment.students?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ID: {payment.students?.student_id}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emsp-green">
                        {payment.amount?.toFixed(2)} €
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.status === 'completed'
                          ? 'Payé'
                          : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

