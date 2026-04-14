# BUILD (Com SDK completo)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia apenas o arquivo de projeto e restaura (Aproveita o Cache do Docker)
COPY ["FaturamentoService.csproj", "./"]
RUN dotnet restore "FaturamentoService.csproj"

# Copia o restante do código e compila
COPY . .
# /p:UseAppHost=false evita gerar um executável desnecessário no Linux, poupando espaço
RUN dotnet publish "FaturamentoService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# FASE FINAL (Apenas o Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Usar esse usuário impede que, se um hacker invadir o container, ele tenha acesso total.
USER $APP_UID 

# Copia os artefatos compilados da fase de build
COPY --from=build /app/publish .

# Informa ao Docker que o serviço escuta na porta 8080 (padrão do .NET 8+)
EXPOSE 8080

ENTRYPOINT ["dotnet", "FaturamentoService.dll"]