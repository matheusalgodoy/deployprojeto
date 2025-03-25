import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/lib/users";

const formSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string()
    .min(10, "Telefone inválido")
    .max(15, "Telefone inválido")
    .regex(/^\(?[0-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/, "Formato inválido. Use (00) 00000-0000"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string().min(6, "A confirmação de senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null);
      // Usar o telefone diretamente sem formatar para WhatsApp
      const telefoneNumerico = values.telefone.replace(/\D/g, '');
      
      // Cadastrar o usuário
      await userService.cadastrar({
        nome: values.nome,
        email: values.email,
        telefone: telefoneNumerico,
        senha: values.senha,
        tipo: 'cliente'
      });
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada. Você pode fazer login agora.",
      });
      
      // Redirecionar após cadastro bem-sucedido
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Falha no cadastro. Tente novamente.";
      setError(errorMessage);
      
      // Mostrar toast de erro também
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/lovable-uploads/a313fca3-1781-4832-a011-eb22c0d3b248.png" alt="Logo Barbearia do Gansinho" />
              <AvatarFallback>BG</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-gray-900">Barbearia do Gansinho</h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cadastrar</h2>
              <p className="text-gray-600 mt-2">Crie sua conta para agendar horários</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmarSenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Cadastrar
                </Button>

                <div className="mt-6 text-center text-sm">
                  <p className="text-gray-600">
                    Já tem uma conta?{" "}
                    <Link to="/login" className="text-blue-600 hover:underline">
                      Entrar
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>

      <footer className="bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-600">
            2023 Barbearia do Gansinho. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
