import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { Send, Search, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router';

type Profile = {
  id: string;
  full_name: string;
  grade: string | null;
};

export function Transfer() {
  const { profile, refreshProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.length > 2) {
      const searchUsers = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, grade')
          .ilike('full_name', `%${searchQuery}%`)
          .neq('id', profile?.id)
          .limit(5);

        if (!error && data) {
          setSearchResults(data);
        }
      };
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, profile?.id]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Por favor, selecione um usuário e insira um valor válido.');
      return;
    }

    if (Number(amount) > (profile?.balance || 0)) {
      setError('Saldo insuficiente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real app, this should be a stored procedure (RPC) in Supabase
      // to ensure transaction atomicity. For this demo, we'll do it sequentially.
      
      // 1. Deduct from sender
      const { error: senderError } = await supabase
        .from('profiles')
        .update({ balance: (profile?.balance || 0) - Number(amount) })
        .eq('id', profile?.id);

      if (senderError) throw senderError;

      // 2. Add to receiver
      // First get receiver's current balance
      const { data: receiverData, error: receiverFetchError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', selectedUser.id)
        .single();

      if (receiverFetchError) throw receiverFetchError;

      const { error: receiverUpdateError } = await supabase
        .from('profiles')
        .update({ balance: receiverData.balance + Number(amount) })
        .eq('id', selectedUser.id);

      if (receiverUpdateError) throw receiverUpdateError;

      // 3. Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          sender_id: profile?.id,
          receiver_id: selectedUser.id,
          amount: Number(amount),
        });

      if (txError) throw txError;

      setSuccess(true);
      await refreshProfile();
      setTimeout(() => navigate('/'), 2000);

    } catch (err: any) {
      console.error('Transfer error:', err);
      setError('Erro ao realizar transferência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
          <Send className="w-8 h-8 text-brand-orange" />
          Transferir Unireais
        </h1>
        <p className="text-gray-500">Envie recompensas para seus colegas.</p>
      </header>

      <Card>
        <CardContent className="p-8">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Transferência Realizada!</h2>
              <p className="text-gray-500">Você enviou {amount} UR para {selectedUser?.full_name}.</p>
              <p className="text-sm text-gray-400 mt-4">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleTransfer} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="bg-orange-50 p-4 rounded-xl border border-brand-orange/20 flex justify-between items-center">
                <span className="text-brand-orange font-medium">Seu Saldo Disponível</span>
                <span className="text-2xl font-bold text-brand-orange">{profile?.balance || 0} UR</span>
              </div>

              {!selectedUser ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Para quem você quer enviar?</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Busque pelo nome do aluno..."
                      className="pl-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-black">{user.full_name}</span>
                            {user.grade && <span className="text-xs text-gray-500">{user.grade}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold text-lg">
                        {selectedUser.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Enviando para</p>
                        <p className="font-semibold text-black">{selectedUser.full_name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-sm text-brand-orange hover:underline"
                    >
                      Trocar
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor (Unireais)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max={profile?.balance || 0}
                        placeholder="0"
                        className="text-3xl font-bold h-20 pl-6"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl uppercase">
                        UR
                      </span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 text-lg" disabled={loading}>
                    {loading ? 'Enviando...' : `Enviar ${amount || 0} UR`}
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
