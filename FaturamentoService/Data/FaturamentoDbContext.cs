using FaturamentoService.Models;
using Microsoft.EntityFrameworkCore;

namespace FaturamentoService.Data;

/// <summary>
/// DbContext do Faturamento: gerencia a persistência das Notas Fiscais e seus Itens.
/// Utiliza Primary Constructor. 
/// </summary>
public class FaturamentoDbContext(DbContextOptions<FaturamentoDbContext> options) : DbContext(options)
{
    // O uso de => Set<T>() ajuda o compilador com as regras de Nullable Reference Types
    public DbSet<NotaFiscal> NotasFiscais => Set<NotaFiscal>();
    public DbSet<ItemNotaFiscal> ItensNotaFiscal => Set<ItemNotaFiscal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NotaFiscal>(entity =>
        {
            entity.HasKey(n => n.Id);
            
            // Garante que o número da nota jamais se repita
            entity.HasIndex(n => n.Numero).IsUnique();

            // Converte o enum para string no banco (mais legível que int)
            entity.Property(n => n.Status)
                .HasConversion<string>()
                .HasMaxLength(20);
        });

        modelBuilder.Entity<ItemNotaFiscal>(entity =>
        {
            entity.HasKey(i => i.Id);

            // Índice Composto: Um produto não pode aparecer duas vezes na mesma nota
            entity.HasIndex(i => new { i.NotaFiscalId, i.ProdutoId }).IsUnique();

            entity.Property(i => i.ProdutoCodigo)
                .IsRequired()
                .HasMaxLength(50);
                  
            entity.Property(i => i.ProdutoDescricao)
                .IsRequired()
                .HasMaxLength(200);

            // Relacionamento Pai-Filho rigoroso com Cascade Delete
            entity.HasOne(i => i.NotaFiscal)
                .WithMany(n => n.Itens)
                .HasForeignKey(i => i.NotaFiscalId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}