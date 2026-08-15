import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AddReview from './pages/AddReview.jsx'
import ReviewDetail from './pages/ReviewDetail.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddReview />} />
        <Route path="/review/:id" element={<ReviewDetail />} />
        <Route path="/review/:id/edit" element={<AddReview />} />
      </Routes>
    </BrowserRouter>
  )
}
