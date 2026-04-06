import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sharePrescription, checkIsDoctor, getPatientPrescriptions, getAllDoctors, getDoctorDetails, Doctor } from '@/utils/web3';
import { Link } from 'react-router-dom';

interface PrescriptionDisplay {
  id: number;
  medication: string;
  doctor: string;
  doctorName: string;
  timestamp: number;
}

const SharePrescription = () => {
  const [doctorCRM, setDoctorCRM] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDisplay[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<string>('');
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  
  // Carregar prescrições do usuário e lista de médicos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Obter o endereço do paciente logado do localStorage
        const userDataStr = localStorage.getItem('chainmed-user');
        if (!userDataStr) {
          toast.error('Usuário não encontrado. Por favor, faça login novamente.');
          return;
        }
        
        const userData = JSON.parse(userDataStr);
        if (userData.userType !== 'patient') {
          toast.error('Acesso não autorizado.');
          return;
        }
        
        // Carregar todos os médicos registrados
        setLoadingDoctors(true);
        const allDoctors = await getAllDoctors();
        setDoctors(allDoctors);
        setLoadingDoctors(false);
        
        // Carregar prescrições do paciente
        setLoadingPrescriptions(true);
        const patientPrescriptions = await getPatientPrescriptions(userData.address);
        
        // Processar os dados das prescrições para exibição
        const prescriptionsDisplay: PrescriptionDisplay[] = [];
        
        for (const prescription of patientPrescriptions) {
          // Obter detalhes do médico
          const doctor = await getDoctorDetails(prescription.doctor);
          
          if (doctor) {
            prescriptionsDisplay.push({
              id: prescription.id,
              medication: prescription.medication,
              doctor: prescription.doctor,
              doctorName: doctor.name,
              timestamp: prescription.timestamp
            });
          }
        }
        
        setPrescriptions(prescriptionsDisplay);
        setLoadingPrescriptions(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados da blockchain');
        setLoadingPrescriptions(false);
        setLoadingDoctors(false);
      }
    };
    
    loadData();
  }, []);
  
  const findDoctorBycrm = (crm: string): Doctor | undefined => {
    return doctors.find(doctor => doctor.crm.toLowerCase() === crm.toLowerCase());
  };
  
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctorCRM) {
      toast.error('Digite o CRM do médico');
      return;
    }
    
    if (!selectedPrescription) {
      toast.error('Selecione uma prescrição para compartilhar');
      return;
    }
    
    // Encontrar o médico pelo CRM
    setValidating(true);
    const doctor = findDoctorBycrm(doctorCRM);
    
    if (!doctor) {
      toast.error('Médico com este CRM não encontrado');
      setValidating(false);
      return;
    }
    
    // Verificar se o endereço é de um médico registrado
    try {
      const isDoctor = await checkIsDoctor(doctor.address);
      if (!isDoctor) {
        toast.error('Endereço não pertence a um médico registrado');
        setValidating(false);
        return;
      }
    } catch (error) {
      console.error('Erro ao validar médico:', error);
      toast.error('Erro ao validar médico');
      setValidating(false);
      return;
    }
    
    setValidating(false);
    setLoading(true);
    toast.loading('Compartilhando prescrição...');
    
    try {
      // Compartilhar prescrição usando o contrato
      const success = await sharePrescription(
        parseInt(selectedPrescription),
        doctor.address
      );
      
      if (success) {
        toast.dismiss();
        toast.success('Prescrição compartilhada com sucesso!');
        setDoctorCRM('');
        setSelectedPrescription('');
      } else {
        toast.dismiss();
        toast.error('Falha ao compartilhar prescrição');
      }
    } catch (error) {
      console.error('Erro ao compartilhar prescrição:', error);
      toast.dismiss();
      toast.error('Erro ao compartilhar prescrição');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compartilhar Prescrição</h1>
            <p className="text-gray-600">Compartilhe suas prescrições com outros médicos</p>
          </div>
          <div>
            <Link to="/patient/profile">
              <Button variant="outline">
                Meu Perfil
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Compartilhar com Médico</CardTitle>
              <CardDescription>
                Digite o CRM do médico com quem deseja compartilhar
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleShare}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor-crm">CRM do Médico</Label>
                  <Input
                    id="doctor-crm"
                    placeholder="Digite o CRM do médico (ex: 12345-SP)"
                    value={doctorCRM}
                    onChange={(e) => setDoctorCRM(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prescription">Selecione a Prescrição</Label>
                  <Select 
                    value={selectedPrescription} 
                    onValueChange={setSelectedPrescription}
                    disabled={loadingPrescriptions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma prescrição" />
                    </SelectTrigger>
                    <SelectContent>
                      {prescriptions.map((prescription) => (
                        <SelectItem 
                          key={prescription.id} 
                          value={prescription.id.toString()}
                        >
                          {prescription.medication} - {new Date(prescription.timestamp * 1000).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingPrescriptions && (
                    <p className="text-sm text-gray-500">Carregando prescrições...</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-medical-500 hover:bg-medical-600"
                  disabled={loading || validating || !selectedPrescription || loadingDoctors}
                >
                  {loading ? 'Compartilhando...' : 'Compartilhar'}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Como funciona?</h2>
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 bg-medical-100 text-medical-600 rounded-full flex items-center justify-center">1</div>
                <div>
                  <h3 className="font-medium">Digite o CRM</h3>
                  <p className="text-gray-600">Insira o CRM do médico para quem deseja compartilhar sua prescrição.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 bg-medical-100 text-medical-600 rounded-full flex items-center justify-center">2</div>
                <div>
                  <h3 className="font-medium">Escolha a prescrição</h3>
                  <p className="text-gray-600">Selecione qual prescrição deseja compartilhar com o médico.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 bg-medical-100 text-medical-600 rounded-full flex items-center justify-center">3</div>
                <div>
                  <h3 className="font-medium">Confirme a transação</h3>
                  <p className="text-gray-600">Aprove a transação em sua carteira MetaMask para compartilhar a prescrição.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SharePrescription;
