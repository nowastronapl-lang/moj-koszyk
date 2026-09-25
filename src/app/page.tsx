import { ArrowDownRight, Receipt, Package } from 'lucide-react';

export default function Dashboard() {
  return (
    <main className="p-4 lg:p-8 max-w-4xl mx-auto pb-28 lg:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-txt-primary-light">Cześć, Jakub 👋</h1>
        <p className="text-sm text-txt-secondary-light">Wrzesień 2026</p>
      </header>

      <section className="bg-card-light border border-border-light rounded-card p-6 mb-6 shadow-sm">
        <span className="text-sm text-txt-secondary-light font-medium">Wydano</span>
        <div className="text-3xl font-bold text-txt-primary-light my-1">1 284,52 zł</div>
        <div className="inline-flex items-center gap-1 text-sm font-medium text-brand-green bg-green-50 px-2.5 py-1 rounded-badge">
          <ArrowDownRight size={16} />
          <span>8,4% vs sierpień</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card-light border border-border-light rounded-card p-4">
          <div className="flex items-center gap-2 text-txt-secondary-light text-sm mb-1">
            <Receipt size={16} />
            <span>Liczba zakupów</span>
          </div>
          <div className="text-xl font-bold">18</div>
        </div>
        <div className="bg-card-light border border-border-light rounded-card p-4">
          <div className="flex items-center gap-2 text-txt-secondary-light text-sm mb-1">
            <Package size={16} />
            <span>Liczba produktów</span>
          </div>
          <div className="text-xl font-bold">142</div>
        </div>
      </section>
    </main>
  );
}