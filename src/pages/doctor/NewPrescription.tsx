import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPrescription, getPatientDetails, getAllPatients } from '@/utils/web3';
import { toast } from 'sonner';

const NewPrescription = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientFound, setPatientFound] = useState(false);
  const [patientData, setPatientData] = useState({
    name: '',
    cpf: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allPatients, setAllPatients] = useState<Array<{name: string, cpf: string, address: string}>>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', instructions: '' }],
    observations: '',
    expiryDate: ''
  });

  // Carregar todos os pacientes ao iniciar a página
  useEffect(() => {
    const loadAllPatients = async () => {
      try {
        setLoadingPatients(true);
        const patients = await getAllPatients();
        
        const formattedPatients = patients.map(patient => ({
          name: patient.name,
          cpf: patient.cpf,
          address: patient.address
        }));
        
        setAllPatients(formattedPatients);
      } catch (error) {
        console.error('Erro ao carregar lista de pacientes:', error);
        toast.error('Erro ao carregar lista de pacientes');
      } finally {
        setLoadingPatients(false);
      }
    };
    
    loadAllPatients();
  }, []);

  const searchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm) return;
    
    setLoading(true);
    
    try {
      // Verificar se o searchTerm é um endereço Ethereum
      if (searchTerm.startsWith('0x') && searchTerm.length === 42) {
        // Buscar paciente pelo endereço
        const patientDetails = await getPatientDetails(searchTerm);
        
        if (patientDetails && patientDetails.isRegistered) {
          setPatientData({
            name: patientDetails.name,
            cpf: patientDetails.cpf,
            address: searchTerm
          });
          setPatientFound(true);
        } else {
          toast.error('Paciente não encontrado ou não registrado.');
          setPatientFound(false);
        }
      } else {
        // Buscar paciente por CPF ou nome na lista carregada
        const searchTermLower = searchTerm.toLowerCase();
        const foundPatient = allPatients.find(patient => 
          patient.cpf.includes(searchTerm) || 
          patient.name.toLowerCase().includes(searchTermLower)
        );
        
        if (foundPatient) {
          setPatientData(foundPatient);
          setPatientFound(true);
        } else {
          toast.error('Paciente não encontrado. Verifique o CPF ou nome digitado.');
          setPatientFound(false);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      toast.error('Erro ao buscar paciente. Tente novamente.');
      setPatientFound(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [
        ...prescriptionData.medications,
        { name: '', dosage: '', instructions: '' }
      ]
    });
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionData({
      ...prescriptionData,
      medications: prescriptionData.medications.filter((_, i) => i !== index)
    });
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updatedMedications = [...prescriptionData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    setPrescriptionData({
      ...prescriptionData,
      medications: updatedMedications
    });
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientFound) {
      toast.error('Nenhum paciente selecionado. Por favor, busque um paciente primeiro.');
      return;
    }
    
    setIsSubmitting(true);
    toast.loading('Enviando prescrição para a blockchain...');
    
    try {
      // Para cada medicamento, criar uma prescrição separada
      for (const medication of prescriptionData.medications) {
        // Criar prescrição usando o contrato
        const success = await createPrescription(
          patientData.address,
          medication.name,
          medication.dosage,
          medication.instructions
        );
        
        if (!success) {
          throw new Error('Falha ao criar prescrição');
        }
      }
      
      toast.dismiss();
      toast.success('Prescrição criada com sucesso!');
      
      // Reset the form
      setPrescriptionData({
        diagnosis: '',
        medications: [{ name: '', dosage: '', instructions: '' }],
        observations: '',
        expiryDate: ''
      });
      
      // Reset patient selection
      setPatientFound(false);
      setPatientData({
        name: '',
        cpf: '',
        address: ''
      });
      setSearchTerm('');
      
    } catch (error) {
      console.error('Erro ao criar prescrição:', error);
      toast.dismiss();
      toast.error('Erro ao criar prescrição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Prescrição</h1>
          <p className="text-gray-600">Crie uma nova prescrição médica para um paciente.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Buscar Paciente</CardTitle>
              <CardDescription>
                Digite o endereço da carteira, CPF ou nome do paciente para iniciar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={searchPatient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Endereço, CPF ou Nome</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="Digite para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={loading || !searchTerm || loadingPatients}>
                      {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                  {loadingPatients && (
                    <p className="text-xs text-gray-500 mt-1">Carregando lista de pacientes...</p>
                  )}
                </div>
              </form>
              
              {patientFound && (
                <div className="mt-6 p-4 bg-medical-50 rounded-md border border-medical-100">
                  <h3 className="font-medium text-gray-900">Paciente Encontrado</h3>
                  <dl className="mt-2 text-sm">
                    <div className="flex justify-between py-1">
                      <dt className="text-gray-500">Nome:</dt>
                      <dd className="font-medium text-gray-900">{patientData.name}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="text-gray-500">CPF:</dt>
                      <dd className="font-medium text-gray-900">{patientData.cpf}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="text-gray-500">Carteira:</dt>
                      <dd className="font-medium text-gray-900 text-xs">
                        {patientData.address.slice(0, 6)}...{patientData.address.slice(-4)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
              
              {!loadingPatients && allPatients.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-md border border-yellow-100">
                  <p className="text-sm text-yellow-700">
                    Nenhum paciente registrado encontrado na blockchain. Os pacientes precisam se registrar primeiro.
                  </p>
                </div>
              )}
              
              {!loadingPatients && allPatients.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Pacientes Registrados ({allPatients.length})</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <ul className="divide-y">
                      {allPatients.map((patient, index) => (
                        <li key={index} className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => {
                          setPatientData(patient);
                          setPatientFound(true);
                          setSearchTerm(patient.name);
                        }}>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-gray-500">CPF: {patient.cpf}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados da Prescrição</CardTitle>
              <CardDescription>
                Preencha todos os dados necessários para a prescrição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="prescriptionForm" onSubmit={handleSubmitPrescription} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Input
                    id="diagnosis"
                    value={prescriptionData.diagnosis}
                    onChange={(e) => setPrescriptionData({...prescriptionData, diagnosis: e.target.value})}
                    required
                    disabled={!patientFound}
                  />
                </div>

                <Tabs defaultValue="medications" className="w-full">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="medications">Medicamentos</TabsTrigger>
                    <TabsTrigger value="observations">Observações</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="medications" className="space-y-4 mt-4">
                    {prescriptionData.medications.map((med, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4 relative">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor={`med-name-${index}`}>Nome do Medicamento</Label>
                          <Input
                            id={`med-name-${index}`}
                            value={med.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            required
                            disabled={!patientFound}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`med-dosage-${index}`}>Dosagem</Label>
                          <Input
                            id={`med-dosage-${index}`}
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            required
                            disabled={!patientFound}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`med-instructions-${index}`}>Instruções</Label>
                          <Textarea
                            id={`med-instructions-${index}`}
                            value={med.instructions}
                            onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                            required
                            disabled={!patientFound}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleAddMedication}
                      disabled={!patientFound}
                      className="w-full border-dashed"
                    >
                      + Adicionar Medicamento
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="observations" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observações Adicionais</Label>
                      <Textarea
                        id="observations"
                        value={prescriptionData.observations}
                        onChange={(e) => setPrescriptionData({...prescriptionData, observations: e.target.value})}
                        rows={5}
                        disabled={!patientFound}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Válido até</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={prescriptionData.expiryDate}
                        onChange={(e) => setPrescriptionData({...prescriptionData, expiryDate: e.target.value})}
                        required
                        disabled={!patientFound}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                form="prescriptionForm" 
                type="submit" 
                className="bg-medical-500 hover:bg-medical-600"
                disabled={!patientFound || isSubmitting}
              >
                {isSubmitting ? 'Processando...' : 'Criar Prescrição'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default NewPrescription;
