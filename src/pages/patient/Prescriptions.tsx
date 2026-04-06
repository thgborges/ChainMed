import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { getPatientPrescriptions, getPrescription, getDoctorDetails, generatePrescriptionQRCode } from '@/utils/web3';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

interface PrescriptionDisplay {
  id: number;
  doctorName: string;
  doctorCrm: string;
  doctorSpecialty: string;
  doctorAddress: string;
  medication: string;
  dosage: string;
  instructions: string;
  date: Date;
  status: 'active' | 'expired';
}

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDisplay | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    // Carregar prescrições da blockchain
    const fetchPrescriptions = async () => {
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
        
        // Buscar prescrições do paciente
        const patientPrescriptions = await getPatientPrescriptions(userData.address);
        
        // Processar os dados das prescrições para exibição
        const prescriptionsDisplay: PrescriptionDisplay[] = [];
        
        for (const prescription of patientPrescriptions) {
          // Obter detalhes do médico
          const doctor = await getDoctorDetails(prescription.doctor);
          
          if (doctor) {
            // Verificar se a prescrição está ativa ou expirada
            // Consideramos expirada se tiver mais de 30 dias
            const prescriptionDate = new Date(prescription.timestamp * 1000);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - prescriptionDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const status = diffDays <= 30 ? 'active' : 'expired';
            
            prescriptionsDisplay.push({
              id: prescription.id,
              doctorName: doctor.name,
              doctorCrm: doctor.crm,
              doctorSpecialty: doctor.specialty,
              doctorAddress: doctor.address,
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
        console.error('Erro ao carregar prescrições:', error);
        toast.error('Erro ao carregar prescrições da blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => 
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doctorCrm.includes(searchTerm) ||
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPrescription = (prescription: PrescriptionDisplay) => {
    setSelectedPrescription(prescription);
  };

  const handleShowQRCode = async (prescription: PrescriptionDisplay) => {
    try {
      setSelectedPrescription(prescription);
      const qrData = await generatePrescriptionQRCode(prescription.id);
      setQrCodeData(qrData);
      setShowQRCode(true);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Prescrições</h1>
            <p className="text-gray-600">Visualize suas prescrições médicas</p>
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
              <p className="text-gray-500">Nenhuma prescrição encontrada</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className={prescription.status === 'expired' ? 'opacity-70' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{prescription.doctorName}</span>
                    {prescription.status === 'expired' && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full shrink-0">Expirada</span>
                    )}
                    {prescription.status === 'active' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">Ativa</span>
                    )}
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
                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={() => handleViewPrescription(prescription)}
                    variant="outline"
                    className="w-full"
                  >
                    Ver Detalhes
                  </Button>
                  <Button 
                    onClick={() => handleShowQRCode(prescription)}
                    className="bg-medical-500 hover:bg-medical-600 w-full"
                    disabled={prescription.status === 'expired'}
                  >
                    QR Code
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Prescription Details Dialog */}
        <Dialog open={!!selectedPrescription && !showQRCode} onOpenChange={() => setSelectedPrescription(null)}>
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
                  <h3 className="font-medium text-gray-900 mb-2">Médico</h3>
                  <dl className="text-sm">
                    <div className="grid grid-cols-3 py-1">
                      <dt className="text-gray-500">Nome:</dt>
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
        
        {/* QR Code Dialog */}
        <Dialog open={showQRCode} onOpenChange={() => setShowQRCode(false)}>
          {selectedPrescription && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code da Prescrição</DialogTitle>
                <DialogDescription>
                  Use este QR Code na farmácia para acessar sua prescrição
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center py-4">
                <div className="bg-white p-4 rounded-lg border">
                  {qrCodeData && (
                    <QRCodeSVG 
                      value={qrCodeData} 
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                </div>
                <p className="mt-4 text-sm text-center text-gray-500">
                  Prescrição ID: {selectedPrescription.id}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button className="w-full" variant="outline" onClick={() => setShowQRCode(false)}>
                  Fechar
                </Button>
                <Button 
                  className="w-full bg-medical-500 hover:bg-medical-600" 
                  onClick={() => {
                    // Aqui implementaremos o upload para o Pinata
                    toast.success('QR Code salvo com sucesso!');
                  }}
                >
                  Salvar QR Code
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </Layout>
  );
};

export default Prescriptions;
