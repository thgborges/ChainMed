import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getPatientDetails } from '@/utils/web3';

interface PatientProfile {
  name: string;
  cpf: string;
  address: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        setLoading(true);
        
        // Obter o endereço do paciente logado do localStorage
        const userDataStr = localStorage.getItem('chainmed-user');
        if (!userDataStr) {
          toast.error('Usuário não encontrado. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }
        
        const userData = JSON.parse(userDataStr);
        if (userData.userType !== 'patient') {
          toast.error('Acesso não autorizado.');
          setLoading(false);
          return;
        }
        
        // Buscar detalhes do paciente
        const patientDetails = await getPatientDetails(userData.address);
        
        if (patientDetails) {
          setProfile({
            name: patientDetails.name,
            cpf: patientDetails.cpf,
            address: userData.address
          });
        } else {
          toast.error('Não foi possível carregar os dados do perfil.');
        }
      } catch (error) {
        console.error('Erro ao carregar perfil do paciente:', error);
        toast.error('Erro ao carregar dados do perfil da blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
          <p className="text-gray-600">Visualize seus dados cadastrais</p>
        </div>

        {loading ? (
          <Card className="animate-pulse max-w-2xl mx-auto">
            <CardHeader className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ) : profile ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Informações registradas na blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" value={profile.name} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={profile.cpf} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço da Carteira</Label>
                <Input id="address" value={profile.address} readOnly />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.history.back()}>
                Voltar
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto text-center p-8">
            <CardContent>
              <p className="text-gray-500">Perfil não encontrado</p>
              <Button 
                variant="link" 
                onClick={() => window.location.href = '/'}
                className="mt-2"
              >
                Voltar para a página inicial
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
