import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Crown } from 'lucide-react';

type Profile = {
  id: string;
  full_name: string;
  balance: number;
};

export function Ranking() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, balance')
        .order('balance', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-brand-orange" />
          Ranking Escolar
        </h1>
        <p className="text-gray-500">Veja quem são os alunos com mais Unireais.</p>
      </header>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando ranking...</div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum aluno encontrado.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {profiles.map((profile, index) => {
                const isTop3 = index < 3;
                return (
                  <div key={profile.id} className={`p-6 flex items-center justify-between transition-colors ${
                    index === 0 ? 'bg-orange-50/50' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-200 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {index === 0 ? <Crown className="w-6 h-6" /> :
                         index === 1 ? <Medal className="w-6 h-6" /> :
                         index === 2 ? <Medal className="w-6 h-6" /> :
                         `#${index + 1}`}
                      </div>
                      <div>
                        <p className={`font-semibold text-lg ${index === 0 ? 'text-brand-orange' : 'text-black'}`}>
                          {profile.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-xl font-black text-black">
                      {profile.balance} <span className="text-sm font-medium text-gray-500 uppercase">UR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
