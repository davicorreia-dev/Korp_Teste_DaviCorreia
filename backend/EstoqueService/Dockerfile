# BUILD (SDK 10.0)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Cache de dependências: restaura antes de copiar o código (DRY & Performance)
COPY ["EstoqueService.csproj", "./"]
RUN dotnet restore "EstoqueService.csproj"

# Copia o resto e publica
COPY . .
RUN dotnet publish "EstoqueService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# FINAL (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# No .NET 10, rodar como usuário não-root é a regra.
# O UID 1654 (app) já vem configurado na imagem oficial.
USER $APP_UID 

COPY --from=build /app/publish .

# 8080 padrão para containers
EXPOSE 8080

ENTRYPOINT ["dotnet", "EstoqueService.dll"]