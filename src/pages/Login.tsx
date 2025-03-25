import React, { useState, useEffect } from "react";
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
import { atualizarEstruturaBanco } from "@/lib/supabase";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "A senha é obrigatória"),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Atualizar estrutura do banco quando a página carregar
  useEffect(() => {
    const init = async () => {
      try {
        await atualizarEstruturaBanco();
      } catch (error) {
        console.error('Erro ao atualizar banco:', error);
      }
    };
    init();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(null);
      const { data: user, error } = await userService.login(values.email, values.senha);

      if (error) {
        throw error;
      }

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Verificar o tipo de usuário
      const isBarbeiro = user.tipo === 'barbeiro';
      const isCliente = user.tipo === 'cliente';

      // Salvar dados de autenticação
      localStorage.setItem(isBarbeiro ? "barber_authenticated" : "client_authenticated", "true");
      localStorage.setItem(isBarbeiro ? "barber_auth_email" : "client_auth_email", values.email);

      // Redirecionar com base no tipo de usuário
      if (isBarbeiro) {
        navigate("/barbeiro");
      } else if (isCliente) {
        navigate("/agendar");
      } else {
        throw new Error("Tipo de usuário inválido");
      }

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.nome}!`,
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(error.message || "Usuário não encontrado");
      toast({
        title: "Erro no login",
        description: error.message || "Usuário ou senha inválidos",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/scissors.svg" alt="Logo" />
              <AvatarFallback>✂️</AvatarFallback>
            </Avatar>
            <span className="text-xl font-semibold">Barbearia do Gansinho</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-6">Entrar</h1>
            <p className="text-center text-gray-600 mb-6">Faça login para agendar horários</p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
