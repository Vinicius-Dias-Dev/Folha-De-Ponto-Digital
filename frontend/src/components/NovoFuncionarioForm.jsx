import { useState, useRef } from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  useToast,
  Select as CSelect,
  InputGroup,
  InputLeftElement,
  Select,
  Avatar,
  HStack,
  Text,
} from "@chakra-ui/react";
import { FiUser, FiMapPin, FiUsers } from "react-icons/fi";
import api from "../services/api";

export default function NovoFuncionarioForm({ onSaved }) {
  const formRef = useRef(null);
  const toast = useToast();

  const [form, setForm] = useState({
    empregadorNome: "",
    cnpjOuCei: "",
    endereco: "",
    ctpsNumeroESerie: "",
    dataAdmissao: "",
    funcao: "",
    horarioSegASex: "",
    horarioSabado: "",
    descansoSemanal: "",
    mes: "",
    ano: "",
    foto: "",
  });

  const [empregadoBasico, setEmpregadoBasico] = useState({
    nome: "",
    cpf: "",
  });

  const [fotoUploading, setFotoUploading] = useState(false);
  const [touched, setTouched] = useState({});

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const markTouched = (key) =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const handle = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const handleEmp = (k, v) =>
    setEmpregadoBasico((s) => ({ ...s, [k]: v }));

  async function handleUploadFoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFotoUploading(true);
    const dataForm = new FormData();
    dataForm.append("file", file);
    dataForm.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: dataForm }
      );
      const data = await res.json();

      if (data.secure_url) {
        handle("foto", data.secure_url);
        toast({
          title: "Foto enviada!",
          status: "success",
          duration: 2000,
        });
      }
    } catch {
      toast({
        title: "Erro ao enviar a foto",
        status: "error",
      });
    }

    setFotoUploading(false);
  }

  const maskCPF = (value) =>
    value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

  const validar = () => {
    const obrigatorios = ["nome", "cpf", "mes", "ano"];
    const faltando = obrigatorios.filter((key) => {
      const val =
        key === "nome" || key === "cpf"
          ? empregadoBasico[key]
          : form[key];
      return !val?.trim();
    });

    if (faltando.length > 0) {
      faltando.forEach((key) => markTouched(key));
      const firstErrorEl = formRef.current?.querySelector(
        `[data-field="${faltando[0]}"]`
      );
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });

      toast({
        title: "Preencha os campos obrigatórios destacados",
        status: "warning",
        duration: 3000,
      });
      return false;
    }
    return true;
  };

const salvar = async () => {
  if (!validar()) return;

  try {
    const res = await api.post("/empregados", {
      empregado: {
        nome: empregadoBasico.nome,
        cpf: empregadoBasico.cpf,
        foto: form.foto,
      },
      header: {
        ...form,
        mes: Number(form.mes),
        ano: Number(form.ano),
      },
    });

    if (res.status === 201) {
      toast({
        title: "Funcionário salvo com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // ✅ Limpa apenas se foi realmente salvo com sucesso
      setForm({
        empregadorNome: "",
        cnpjOuCei: "",
        endereco: "",
        ctpsNumeroESerie: "",
        dataAdmissao: "",
        funcao: "",
        horarioSegASex: "",
        horarioSabado: "",
        descansoSemanal: "",
        mes: "",
        ano: "",
        foto: "",
      });

      setEmpregadoBasico({ nome: "", cpf: "" });
      setTouched({});
      onSaved?.();
    }
  } catch (error) {
    const msg = error.response?.data?.error || "";

    // ⚠️ Erro de duplicidade (nome ou CPF)
    if (msg.includes("já existente") || msg.includes("já existe")) {
      toast({
        title: "Funcionário já existente",
        description: "Já há um funcionário cadastrado com este nome ou CPF.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return; // não limpa o formulário
    }

    // ❌ Erro inesperado
    toast({
      title: "Erro ao salvar",
      description: msg || "Tente novamente.",
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};


  const baseInput = (field) => ({
    bg: "gray.800",
    borderColor:
      touched[field] &&
      !(field === "nome" || field === "cpf"
        ? empregadoBasico[field]
        : form[field])
        ? "red.400"
        : "gray.700",
    color: "white",
    height: "42px",
    fontSize: "sm",
    "data-field": field,
    _focus: {
      borderColor: "blue.400",
      boxShadow: "0 0 0 1px #3182CE",
    },
  });

  return (
    <Box
      ref={formRef}
      p={6}
      bg="gray.900"
      rounded="lg"
      shadow="md"
      borderWidth="1px"
      borderColor="gray.700"
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>

        {/* FOTO */}
        <FormControl gridColumn="1 / -1" mb={2}>
          <FormLabel color="white" fontSize="sm" mb={1}>
            Foto do Funcionário
          </FormLabel>

          <HStack spacing={3}>
            <Avatar
              size="md"
              name={empregadoBasico.nome}
              src={form.foto || ""}
              bg="gray.700"
              border="2px solid #2a4365"
            />
            <Input
              id="uploadFoto"
              type="file"
              accept="image/*"
              display="none"
              onChange={handleUploadFoto}
            />
            <Button
              as="label"
              htmlFor="uploadFoto"
              size="sm"
              variant="outline"
              colorScheme="blue"
              isDisabled={fotoUploading}
            >
              {fotoUploading ? "Enviando..." : "Selecionar"}
            </Button>
          </HStack>

          {fotoUploading && (
            <Text fontSize="xs" color="gray.300" mt={1}>
              Enviando imagem...
            </Text>
          )}
        </FormControl>

        {/* EMPREGADOR */}
        <FormControl>
          <FormLabel fontSize="sm" color="white">
            Empregador
          </FormLabel>
          <InputGroup>
            <InputLeftElement children={<FiUsers color="#aaa" />} />
            <Input
              {...baseInput("empregadorNome")}
              placeholder="Nome da empresa"
              value={form.empregadorNome}
              onChange={(e) => handle("empregadorNome", e.target.value)}
            />
          </InputGroup>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="white">
            CNPJ / CEI
          </FormLabel>
          <Input
            {...baseInput("cnpjOuCei")}
            placeholder="00.000.000/0000-00"
            value={form.cnpjOuCei}
            onChange={(e) => handle("cnpjOuCei", e.target.value)}
          />
        </FormControl>

        {/* ENDEREÇO */}
        <FormControl gridColumn="1 / -1">
          <FormLabel fontSize="sm" color="white">
            Endereço
          </FormLabel>
          <InputGroup>
            <InputLeftElement children={<FiMapPin color="#aaa" />} />
            <Input
              {...baseInput("endereco")}
              placeholder="Rua, número, bairro"
              value={form.endereco}
              onChange={(e) => handle("endereco", e.target.value)}
            />
          </InputGroup>
        </FormControl>

        {/* FUNCIONÁRIO */}
        <FormControl>
          <FormLabel fontSize="sm" color="white">
            Funcionário*
          </FormLabel>
          <InputGroup>
            <InputLeftElement children={<FiUser color="#aaa" />} />
            <Input
              {...baseInput("nome")}
              placeholder="Nome completo"
              value={empregadoBasico.nome}
              onBlur={() => markTouched("nome")}
              onChange={(e) => handleEmp("nome", e.target.value)}
            />
          </InputGroup>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="white">
            CPF*
          </FormLabel>
          <Input
            {...baseInput("cpf")}
            placeholder="000.000.000-00"
            value={empregadoBasico.cpf}
            onBlur={() => markTouched("cpf")}
            onChange={(e) => handleEmp("cpf", maskCPF(e.target.value))}
          />
        </FormControl>

        {/* HORÁRIOS */}
        <FormControl gridColumn="1 / -1">
          <FormLabel fontSize="sm" color="white">
            Seg a Sex
          </FormLabel>
          <Input
            {...baseInput("horarioSegASex")}
            placeholder="08:00 - 17:00"
            value={form.horarioSegASex}
            onChange={(e) => handle("horarioSegASex", e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="white">
            Sábado
          </FormLabel>
          <Input
            {...baseInput("horarioSabado")}
            placeholder="08:00 - 12:00"
            value={form.horarioSabado}
            onChange={(e) => handle("horarioSabado", e.target.value)}
          />
        </FormControl>
      <FormControl>
        <FormLabel fontSize="sm" color="white">
          Descanso
        </FormLabel>
        <Select
          {...baseInput("descansoSemanal")}
          placeholder="Selecione o dia"
          value={form.descansoSemanal}
          onChange={(e) => handle("descansoSemanal", e.target.value)}
          bg="gray.800"
          borderColor="gray.600"
          color="white"
        >
          <option value="Domingo" style={{ color: "black" }}>Domingo</option>
          <option value="Segunda-feira" style={{ color: "black" }}>Segunda-feira</option>
          <option value="Terça-feira" style={{ color: "black" }}>Terça-feira</option>
          <option value="Quarta-feira" style={{ color: "black" }}>Quarta-feira</option>
          <option value="Quinta-feira" style={{ color: "black" }}>Quinta-feira</option>
          <option value="Sexta-feira" style={{ color: "black" }}>Sexta-feira</option>
          <option value="Sábado" style={{ color: "black" }}>Sábado</option>
        </Select>
      </FormControl>

        {/* MÊS */}
        <FormControl>
          <FormLabel fontSize="sm" color="white">
            Mês*
          </FormLabel>
          <CSelect
            {...baseInput("mes")}
            value={form.mes}
            onBlur={() => markTouched("mes")}
            onChange={(e) => handle("mes", e.target.value)}
          >
            <option value="" style={{ color: "black" }}>
              Selecione
            </option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1} style={{ color: "black" }}>
                {String(i + 1).padStart(2, "0")}
              </option>
            ))}
          </CSelect>
        </FormControl>

        {/* ANO */}
        <FormControl>
          <FormLabel fontSize="sm" color="white">
            Ano*
          </FormLabel>
          <Input
            type="number"
            {...baseInput("ano")}
            placeholder="2025"
            value={form.ano}
            onBlur={() => markTouched("ano")}
            onChange={(e) => handle("ano", e.target.value)}
          />
        </FormControl>
      </SimpleGrid>

      <Button mt={8} colorScheme="blue" size="lg" w="full" onClick={salvar}>
        Salvar Funcionário
      </Button>
    </Box>
  );
}
