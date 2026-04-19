using FaturamentoService.Data;
using FaturamentoService.Middleware;
using FaturamentoService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CONFIGURAÇÃO DE SERVIÇOS

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Faturamento API", Version = "v1" });
});

// EF Core: Isolamento total de dados (Microsserviço puro)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=faturamento.db";
builder.Services.AddDbContext<FaturamentoDbContext>(options => options.UseSqlite(connectionString));

// Injeção de Dependência da Lógica de Negócio
builder.Services.AddScoped<INotaFiscalService, NotaFiscalService>();

// RESILIÊNCIA & COMUNICAÇÃO (Polly)

builder.Services.AddHttpClient<IEstoqueClient, EstoqueClient>(client =>
{
    var baseUrl = builder.Configuration["EstoqueService:BaseUrl"] ?? "http://localhost:5106";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(30); 
})
.AddStandardResilienceHandler(); // Polly: Retry, Circuit Breaker e Timeout automáticos

// SEGURANÇA & ACESSO

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// EXECUÇÃO DO PIPELINE

var app = builder.Build();

// Inicialização automática do banco (KISS para ambiente de dev/teste)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FaturamentoDbContext>();
    db.Database.EnsureCreated();
}


app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Faturamento v1"));
}

app.UseCors("AllowAngular");
app.MapControllers();

app.Run();