import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { getDoctorPrescriptions, getPrescription, getPatientDetails, generatePrescriptionQRCode } from '@/utils/web3';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Medication {
  name: string;
  dosage: string;
}

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

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);

  useEffect(() => {
    // Carregar prescrições da blockchain
    const fetchPrescriptions = async () => {
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
        
        // Buscar prescrições criadas pelo médico
        const doctorPrescriptions = await getDoctorPrescriptions(userData.address);
        
        // Processar os dados das prescrições para exibição
        const prescriptionsDisplay: PrescriptionDisplay[] = [];
        
        for (const prescription of doctorPrescriptions) {
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
        console.error('Erro ao carregar prescrições:', error);
        toast.error('Erro ao carregar prescrições da blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientCpf.includes(searchTerm) ||
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateQRCode = async (id: number) => {
    try {
      setSelectedPrescriptionId(id);
      const qrData = await generatePrescriptionQRCode(id);
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
            <p className="text-gray-600">Gerencie as prescrições que você emitiu</p>
          </div>
          <div className="flex gap-2">
            <Link to="/doctor/profile">
              <Button variant="outline">
                Meu Perfil
              </Button>
            </Link>
            <Link to="/doctor/prescriptions/new">
              <Button className="bg-medical-500 hover:bg-medical-600">
                Nova Prescrição
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
                    <span>{prescription.patientName}</span>
                    {prescription.status === 'expired' && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Expirada</span>
                    )}
                    {prescription.status === 'active' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Ativa</span>
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
                    <div>
                      <span className="text-sm text-gray-500">Instruções:</span>
                      <p className="text-sm">{prescription.instructions}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleGenerateQRCode(prescription.id)}
                    variant="outline"
                    className="w-full"
                    disabled={prescription.status === 'expired'}
                  >
                    Gerar QR Code
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de QR Code */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code da Prescrição</DialogTitle>
            <DialogDescription>
              Escaneie este QR Code para verificar a autenticidade da prescrição
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {qrCodeData && (
              <QRCodeSVG 
                value={qrCodeData} 
                size={256}
                level="H"
                includeMargin={true}
              />
            )}
          </div>
          <div className="flex justify-center gap-2">
            <Button 
              onClick={() => setShowQRCode(false)}
              variant="outline"
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                // Aqui implementaremos o upload para o Pinata
                toast.success('QR Code salvo com sucesso!');
              }}
            >
              Salvar QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Prescriptions;
