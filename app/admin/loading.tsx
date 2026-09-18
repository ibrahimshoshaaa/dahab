export default function AdminLoading() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f4ec] p-6">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-16 rounded-2xl bg-[#e8dfc8]" />
        <div className="h-32 rounded-3xl bg-white" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map((item) => <div key={item} className="h-40 rounded-3xl bg-white" />)}
        </div>
      </div>
    </main>
  )
}
