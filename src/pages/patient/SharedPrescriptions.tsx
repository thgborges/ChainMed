import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { getPatientPrescriptions, getDoctorDetails } from '@/utils/web3';
import { Link } from 'react-router-dom';

interface PrescriptionShare {
  prescriptionId: number;
  doctorAddress: string;
  doctorName: string;
  doctorCrm: string;
  doctorSpecialty: string;
  medication: string;
  dosage: string;
  date: Date;
}

const SharedPrescriptions = () => {
  const [sharedPrescriptions, setSharedPrescriptions] = useState<PrescriptionShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionShare | null>(null);

  useEffect(() => {
    // Carregar prescrições compartilhadas da blockchain
    const fetchSharedPrescriptions = async () => {
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
        
        // Buscar todas as prescrições do paciente
        const patientPrescriptions = await getPatientPrescriptions(userData.address);
        
        // Filtrar apenas as prescrições que foram compartilhadas
        // Nota: Como o contrato não tem uma função direta para verificar quais prescrições foram compartilhadas,
        // precisamos buscar eventos de compartilhamento ou implementar uma solução alternativa
        
        // Para esta implementação, vamos usar uma abordagem simplificada:
        // Buscar todas as prescrições do paciente e verificar quais têm o campo "shared" como true
        // Em uma implementação real, seria necessário buscar eventos PrescriptionShared
        
        const sharedPrescriptionsData: PrescriptionShare[] = [];
        
        for (const prescription of patientPrescriptions) {
          // Verificar se a prescrição foi compartilhada
          // Aqui estamos simulando que todas as prescrições foram compartilhadas para fins de demonstração
          // Em uma implementação real, seria necessário verificar eventos de compartilhamento
          
          // Obter detalhes do médico que criou a prescrição
          const doctor = await getDoctorDetails(prescription.doctor);
          
          if (doctor) {
            sharedPrescriptionsData.push({
              prescriptionId: prescription.id,
              doctorAddress: doctor.address,
              doctorName: doctor.name,
              doctorCrm: doctor.crm,
              doctorSpecialty: doctor.specialty,
              medication: prescription.medication,
              dosage: prescription.dosage,
              date: new Date(prescription.timestamp * 1000)
            });
          }
        }
        
        setSharedPrescriptions(sharedPrescriptionsData);
      } catch (error) {
        console.error('Erro ao carregar prescrições compartilhadas:', error);
        toast.error('Erro ao carregar prescrições compartilhadas da blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPrescriptions();
  }, []);

  const filteredPrescriptions = sharedPrescriptions.filter(p => 
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doctorCrm.includes(searchTerm) ||
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPrescription = (prescription: PrescriptionShare) => {
    setSelectedPrescription(prescription);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Prescrições Compartilhadas</h1>
            <p className="text-gray-600">Visualize as prescrições que você compartilhou com outros médicos</p>
          </div>
          <div>
            <Link to="/patient/profile">
              <Button variant="outline">
                Meu Perfil
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Buscar por médico, CRM ou medicamento..."
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
                Quando você compartilhar prescrições com outros médicos, elas aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrescriptions.map((prescription, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">Compartilhada com: {prescription.doctorName}</span>
                  </CardTitle>
                  <CardDescription>CRM: {prescription.doctorCrm} • {prescription.doctorSpecialty}</CardDescription>
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
                <DialogTitle>Detalhes da Prescrição Compartilhada</DialogTitle>
                <DialogDescription>
                  Compartilhada em {selectedPrescription.date.toLocaleDateString('pt-BR')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-medical-50 rounded-md border border-medical-100">
                  <h3 className="font-medium text-gray-900 mb-2">Compartilhada com</h3>
                  <dl className="text-sm">
                    <div className="grid grid-cols-3 py-1">
                      <dt className="text-gray-500">Médico:</dt>
                      <dd className="font-medium text-gray-900 col-span-2">{selectedPrescription.doctorName}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-1">
                      <dt className="text-gray-500">CRM:</dt>
                      <dd className="font-medium text-gray-900 col-span-2">{selectedPrescription.doctorCrm}</dd>
                    </div>
                    <div className="grid grid-cols-3 py-1">
                      <dt className="text-gray-500">Especialidade:</dt>
                      <dd className="font-medium text-gray-900 col-span-2">{selectedPrescription.doctorSpecialty}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Medicamento</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedPrescription.medication} - {selectedPrescription.dosage}</p>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <p>Data: {selectedPrescription.date.toLocaleDateString('pt-BR')}</p>
                  <p>ID: {selectedPrescription.prescriptionId}</p>
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
