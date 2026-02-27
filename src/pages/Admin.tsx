import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { PlusCircle, Search, X, Coins } from 'lucide-react';
import { Navigate } from 'react-router';

type Profile = {
  id: string;
  full_name: string;
  balance: number;
};

export function Admin() {
  const { profile, refreshProfile } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Protect route
  if (profile && !profile.is_admin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchStudents();
  }, [profile?.id]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, balance')
        .neq('id', profile?.id) // Exclude the admin themselves
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    setMinting(true);
    setError(null);

    try {
      const newBalance = selectedStudent.balance + Number(amount);

      // 1. Add to receiver (Minting coins - no deduction from admin)
      const { error: receiverUpdateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', selectedStudent.id);

      if (receiverUpdateError) throw receiverUpdateError;

      // 2. Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          sender_id: profile?.id,
          receiver_id: selectedStudent.id,
          amount: Number(amount),
        });

      if (txError) throw txError;

      // 3. Update local state to reflect changes immediately
      setStudents(students.map(s => 
        s.id === selectedStudent.id ? { ...s, balance: newBalance } : s
      ));

      setSuccess(true);
      await refreshProfile();
      
      setTimeout(() => {
        setSuccess(false);
        setSelectedStudent(null);
        setAmount('');
      }, 2000);

    } catch (err: any) {
      console.error('Mint error:', err);
      setError('Erro ao gerar moedas. Verifique as permissões do banco de dados.');
    } finally {
      setMinting(false);
    }
  };

  const openModal = (student: Profile) => {
    setSelectedStudent(student);
    setAmount('');
    setError(null);
    setSuccess(false);
  };

  const closeModal = () => {
    if (!minting) {
      setSelectedStudent(null);
      setAmount('');
      setError(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-brand-orange" />
            Gerar Unireais
          </h1>
          <p className="text-gray-500">Área exclusiva do professor para recompensar alunos.</p>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-xl border border-brand-orange/20 flex items-center gap-2">
          <Coins className="w-5 h-5 text-brand-orange" />
          <span className="text-sm font-bold text-brand-orange uppercase tracking-wider">Moedas Infinitas</span>
        </div>
      </header>

      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar aluno pelo nome..."
                className="pl-12 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Carregando lista de alunos...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Nenhum aluno encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Aluno</th>
                    <th className="px-6 py-4 font-medium">Saldo Atual</th>
                    <th className="px-6 py-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-black">{student.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-black">{student.balance} UR</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          onClick={() => openModal(student)}
                          className="shadow-sm"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Recompensar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minting Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {success ? (
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PlusCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Moedas Geradas!</h2>
                <p className="text-gray-500">Você enviou {amount} UR para {selectedStudent.full_name}.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-lg text-black">Recompensar Aluno</h3>
                  <button 
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleMint} className="p-6 space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-brand-orange/20">
                    <div className="w-12 h-12 rounded-full bg-white text-brand-orange flex items-center justify-center font-bold text-lg shadow-sm">
                      {selectedStudent.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-brand-orange/80 font-medium">Enviando para</p>
                      <p className="font-bold text-brand-orange">{selectedStudent.full_name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Recompensa (Unireais)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        placeholder="0"
                        className="text-3xl font-bold h-20 pl-6"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        autoFocus
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl uppercase">
                        UR
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={minting}>
                      {minting ? 'Gerando...' : `Enviar ${amount || 0} UR`}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
