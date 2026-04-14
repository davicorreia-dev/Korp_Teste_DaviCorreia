using EstoqueService.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueService.Data;

/// <summary>
/// DbContext do EF Core: representa a sessão com o banco de dados.
/// </summary>
public class EstoqueDbContext(DbContextOptions<EstoqueDbContext> options) : DbContext(options)
{
    // DbSet representa a tabela em si.
    public DbSet<Produto> Produtos => Set<Produto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Aplicando configurações de forma fluida (Fluent API)
        modelBuilder.Entity<Produto>(entity =>
        {
            entity.HasKey(p => p.Id);

            // Índice único: Proteção extra além da aplicação
            entity.HasIndex(p => p.Codigo).IsUnique();

            entity.Property(p => p.Codigo)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(p => p.Descricao)
                .IsRequired()
                .HasMaxLength(200);

            // Check Constraint: Garante no nível do banco que o saldo nunca seja negativo
            entity.ToTable(t => t.HasCheckConstraint("CK_Produto_Saldo", "[Saldo] >= 0"));
            
            // Valor padrão para datas de auditoria
            entity.Property(p => p.CriadoEm).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}