import Layout from '../components/Layout'
import StudentList from '../components/students/StudentList'

export default function Students() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-emsp-green">Étudiants</h1>
          <p className="text-gray-600 mt-1">
            Gérez les étudiants et leurs paiements
          </p>
        </div>
        <StudentList />
      </div>
    </Layout>
  )
}
