import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

const Index = () => {
  const isAuthenticated = localStorage.getItem("client_authenticated") === "true";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src="/ganso-logo.png" alt="Logo Barbearia do Gansinho" />
              <AvatarFallback>BG</AvatarFallback>
            </Avatar>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Barbearia do Gansinho</h1>
          </div>
          <div className="flex space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" className="sm:size-default" asChild>
                  <Link to="/meus-agendamentos">Meus Agendamentos</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="sm:size-default"
                  onClick={() => {
                    localStorage.removeItem("client_auth_token");
                    localStorage.removeItem("client_auth_timestamp");
                    localStorage.removeItem("client_auth_email");
                    localStorage.removeItem("client_authenticated");
                    window.location.reload();
                  }}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="sm:size-default" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button size="sm" className="sm:size-default" asChild>
                  <Link to="/register">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-6 p-4 bg-amber-100 border border-amber-300 rounded-lg">
            <p className="text-amber-800 font-medium">
              <strong>Atenção:</strong> Este sistema está em fase de testes e pode apresentar bugs. 
              Em caso de problemas, entre em contato com o desenvolvedor: Matheus Godoy.
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Agende seu horário com facilidade</h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Sistema de agendamento online para barbearias com notificações via WhatsApp
          </p>
          <Button size="lg" className="px-6 sm:px-8" asChild>
            <Link to={isAuthenticated ? "/agendar" : "/login"}>Agendar agora</Link>
          </Button>
        </div>
      </section>

      {/* Benefícios */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h3 className="text-2xl font-bold text-center mb-12">Como funciona</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-6 w-6" />
                <CardTitle>Agende online</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Escolha o dia e horário que melhor se encaixa na sua agenda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <ClockIcon className="h-6 w-6" />
                <CardTitle>Receba lembretes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Notificações automáticas via WhatsApp para não perder seu horário
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-6">Pronto para agendar seu horário?</h3>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/agendar">Começar agora</Link>
          </Button>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src="/ganso-logo.png" alt="Logo Barbearia do Gansinho" />
                <AvatarFallback>BG</AvatarFallback>
              </Avatar>
              <span className="text-base sm:text-lg font-bold text-gray-900">Barbearia do Gansinho</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              &copy; 2023 Barbearia do Gansinho. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
