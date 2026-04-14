using EstoqueService.Data;
using EstoqueService.Middleware;
using EstoqueService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURAÇÃO DE SERVIÇOS (DI Container)

builder.Services.AddControllers();

builder.Services.AddOpenApi(); 

// Configuração do Banco de Dados com SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=estoque.db";

builder.Services.AddDbContext<EstoqueDbContext>(options =>
    options.UseSqlite(connectionString));

// Injeção de Dependência: Scoped cria uma instância por requisição HTTP
builder.Services.AddScoped<IProdutoService, ProdutoService>();

// CORS: Essencial para comunicação do Frontend Angular com a API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:5001")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// 2. CONSTRUÇÃO E PIPELINE (Middlewares)

var app = builder.Build();

// Inicialização automática do banco para ambiente de desenvolvimento
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<EstoqueDbContext>();
    // EnsureCreated é para SQLite/Prototipagem rápida
    db.Database.EnsureCreated();
    
    app.MapOpenApi(); // Expõe o documento OpenAPI (swagger.json)
}

app.UseMiddleware<ExceptionMiddleware>();

app.UseCors("AllowAngular");

// Mapeia as rotas dos Controllers (ex: api/produtos)
app.MapControllers();

app.Run();