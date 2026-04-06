import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { getSharedPrescriptions, getPrescription, getPatientDetails } from '@/utils/web3';
import { Link } from 'react-router-dom';

interface PrescriptionDisplay {
  id: number;
  patientName: string;
  patientCpf: string;
  patientAddress: string;
  medication: string;
  dosage: string;
  instructions: string;
  date: Date;
  status: 'active' | 'expired';
}

const SharedPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDisplay | null>(null);

  useEffect(() => {
    // Carregar prescrições compartilhadas da blockchain
    const fetchSharedPrescriptions = async () => {
      try {
        setLoading(true);
        
        // Obter o endereço do médico logado do localStorage
        const userDataStr = localStorage.getItem('chainmed-user');
        if (!userDataStr) {
          toast.error('Usuário não encontrado. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }
        
        const userData = JSON.parse(userDataStr);
        if (userData.userType !== 'doctor') {
          toast.error('Acesso não autorizado.');
          setLoading(false);
          return;
        }
        
        // Buscar prescrições compartilhadas com o médico
        const sharedPrescriptions = await getSharedPrescriptions(userData.address);
        
        // Processar os dados das prescrições para exibição
        const prescriptionsDisplay: PrescriptionDisplay[] = [];
        
        for (const prescription of sharedPrescriptions) {
          // Obter detalhes do paciente
          const patient = await getPatientDetails(prescription.patient);
          
          if (patient) {
            // Verificar se a prescrição está ativa ou expirada
            // Consideramos expirada se tiver mais de 30 dias
            const prescriptionDate = new Date(prescription.timestamp * 1000);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - prescriptionDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const status = diffDays <= 30 ? 'active' : 'expired';
            
            prescriptionsDisplay.push({
              id: prescription.id,
              patientName: patient.name,
              patientCpf: patient.cpf,
              patientAddress: patient.address,
              medication: prescription.medication,
              dosage: prescription.dosage,
              instructions: prescription.instructions,
              date: prescriptionDate,
              status
            });
          }
        }
        
        setPrescriptions(prescriptionsDisplay);
      } catch (error) {
        console.error('Erro ao carregar prescrições compartilhadas:', error);
        toast.error('Erro ao carregar prescrições compartilhadas da blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientCpf.includes(searchTerm) ||
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPrescription = (prescription: PrescriptionDisplay) => {
    setSelectedPrescription(prescription);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Prescrições Compartilhadas</h1>
            <p className="text-gray-600">Visualize prescrições compartilhadas com você</p>
          </div>
          <div>
            <Link to="/doctor/profile">
              <Button variant="outline">
                Meu Perfil
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Buscar por paciente, CPF ou medicamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="h-9 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <p className="text-gray-500">Nenhuma prescrição compartilhada encontrada</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              )}
              <p className="text-sm text-gray-400 mt-4">
                Quando pacientes compartilharem prescrições com você, elas aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className={prescription.status === 'expired' ? 'opacity-70' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{prescription.patientName}</span>
                    {prescription.status === 'expired' && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full shrink-0">Expirada</span>
                    )}
                    {prescription.status === 'active' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">Ativa</span>
                    )}
                  </CardTitle>
                  <CardDescription>CPF: {prescription.patientCpf}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Medicamento:</span>
                      <p className="font-medium">{prescription.medication}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Dosagem:</span>
                      <p className="font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Data:</span>
                      <p className="font-medium">{prescription.date.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleViewPrescription(prescription)}
                    className="w-full"
                  >
                    Ver Detalhes
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Prescription Details Dialog */}
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          {selectedPrescription && (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Detalhes da Prescrição</DialogTitle>
                <DialogDescription>
                  Emitida em {selectedPrescription.date.toLocaleDateString('pt-BR')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-medical-50 rounded-md border border-medical-100">
                  <h3 className="font-medium text-gray-900 mb-2">Paciente</h3>
                  <dl className="text-sm">
                    <div className="grid grid-cols-3 py-1">
                      <dt className="text-gray-500">Nome:</dt>
                      <dd className="font-medium text-gray-900 col-span-2">{selectedPrescription.patientName}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-1">
                      <dt className="text-gray-500">CPF:</dt>
                      <dd className="font-medium text-gray-900 col-span-2">{selectedPrescription.patientCpf}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Medicamento</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedPrescription.medication} - {selectedPrescription.dosage}</p>
                    <p className="text-sm text-gray-600">{selectedPrescription.instructions}</p>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <p>Data: {selectedPrescription.date.toLocaleDateString('pt-BR')}</p>
                  <p>ID: {selectedPrescription.id}</p>
                </div>
              </div>
              
              <DialogClose asChild>
                <Button className="w-full mt-2">Fechar</Button>
              </DialogClose>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </Layout>
  );
};

export default SharedPrescriptions;
