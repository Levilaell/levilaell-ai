import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  isLegacyAnalysis,
  type DiagnosisAnalysis,
  type DiagnosisAnalysisLegacy,
  type DiagnosisAnalysisV2,
  type LegacyRecommendedApproach,
  type RecommendedApproachV2,
} from "@/types/diagnosis";
import { siteConfig } from "@/lib/site";

const BRAND = "#f59e0b";
const INK = "#18181b";
const MUTED = "#52525b";
const BORDER = "#e4e4e7";
const BG_SOFT = "#fafafa";
const ALERT_BG = "#fef3c7";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10.5,
    color: INK,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoSquare: {
    width: 22,
    height: 22,
    backgroundColor: INK,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "center",
    paddingTop: 5,
    marginRight: 8,
  },
  brandName: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  meta: { fontSize: 9, color: MUTED },
  eyebrow: {
    fontSize: 8.5,
    color: MUTED,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 12 },
  lead: { fontSize: 11, color: INK, marginBottom: 6 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginTop: 22,
    marginBottom: 10,
  },
  opportunityCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  opportunityHeader: { flexDirection: "row", marginBottom: 6 },
  opportunityIndex: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: BRAND,
    marginRight: 8,
  },
  opportunityTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, flex: 1 },
  opportunityDesc: { fontSize: 10, color: INK, marginBottom: 8 },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  metaItem: {
    fontSize: 9,
    color: MUTED,
    marginRight: 14,
    marginBottom: 3,
  },
  metaLabel: { fontFamily: "Helvetica-Bold", color: INK },
  gargaloBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 6,
    padding: 14,
    backgroundColor: BG_SOFT,
    marginTop: 4,
  },
  gargaloArea: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 6,
  },
  planRow: { flexDirection: "row", marginTop: 6, marginBottom: 4 },
  planCell: {
    flex: 1,
    paddingRight: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: BRAND,
    borderLeftStyle: "solid",
  },
  planLabel: {
    fontSize: 8.5,
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  planText: { fontSize: 9.5, color: INK, lineHeight: 1.4 },
  quickWinBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 6,
    padding: 14,
    backgroundColor: BG_SOFT,
  },
  quickWinTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 8 },
  step: { flexDirection: "row", marginBottom: 4 },
  stepNum: {
    width: 16,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: BRAND,
  },
  stepText: { flex: 1, fontSize: 10 },
  roiRow: { flexDirection: "row", marginTop: 6, marginBottom: 4 },
  roiCell: { flex: 1, paddingRight: 8 },
  roiLabel: {
    fontSize: 8.5,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  roiValue: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  disclaimer: {
    fontSize: 8.5,
    color: MUTED,
    fontStyle: "italic",
    marginTop: 4,
  },
  approachBadge: {
    backgroundColor: INK,
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  alertBox: {
    backgroundColor: ALERT_BG,
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
    borderLeftStyle: "solid",
    padding: 12,
    marginTop: 6,
  },
  alertLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
  },
  alertText: { fontSize: 10 },
  ctaBox: {
    marginTop: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: INK,
    borderStyle: "solid",
    borderRadius: 6,
  },
  ctaTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4 },
  ctaText: { fontSize: 10, marginBottom: 6 },
  link: { color: BRAND, textDecoration: "underline" },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 28,
    fontSize: 8.5,
    color: MUTED,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopStyle: "solid",
    paddingTop: 10,
  },
});

const approachLabelsV2: Record<RecommendedApproachV2, string> = {
  diy: "Faça você mesmo",
  conversa: "Conversa exploratória (30 min)",
  proposta_formal: "Proposta formal de projeto",
};

const approachLabelsLegacy: Record<LegacyRecommendedApproach, string> = {
  diy: "Faça você mesmo",
  consultoria_pontual: "Consultoria pontual",
  parceria_continua: "Parceria contínua",
  ainda_nao_e_hora: "Automação ainda não é prioridade",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type Props = {
  name: string;
  analysis: DiagnosisAnalysis;
  generatedAt?: Date;
  reportUrl?: string;
};

function DiagnosisReportDocument({
  name,
  analysis,
  generatedAt = new Date(),
  reportUrl,
}: Props) {
  // V2 é a forma padrão pós-2026-05-18. Legacy só é gerado se alguém
  // reprocessar um diagnóstico antigo (improvável na prática, mas suportado).
  const legacy = isLegacyAnalysis(analysis);

  return (
    <Document
      title={`Diagnóstico${legacy ? " de Operação" : " Contábil"} — ${name}`}
      author={siteConfig.name}
      subject={
        legacy
          ? "Diagnóstico de operação gerado por IA"
          : "Diagnóstico contábil gerado por IA"
      }
      creator={siteConfig.name}
      producer={siteConfig.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brandRow}>
            <Text style={styles.logoSquare}>LL</Text>
            <Text style={styles.brandName}>{siteConfig.name}</Text>
          </View>
          <Text style={styles.meta}>{formatDate(generatedAt)}</Text>
        </View>

        <Text style={styles.eyebrow}>
          {legacy ? "Diagnóstico de operação · IA" : "Diagnóstico contábil · IA"}
        </Text>
        <Text style={styles.title}>Relatório para {name}</Text>
        <Text style={styles.lead}>{analysis.diagnostico_resumido}</Text>

        {legacy
          ? renderLegacyBody(analysis as DiagnosisAnalysisLegacy)
          : renderV2Body(analysis as DiagnosisAnalysisV2)}

        {reportUrl && (
          <View style={styles.ctaBox} wrap={false}>
            <Text style={styles.ctaTitle}>Versão online + agendamento</Text>
            <Text style={styles.ctaText}>
              Acesse este relatório online (sempre atualizado) e agende uma
              conversa técnica de 30min — sem pitch.
            </Text>
            <Link src={reportUrl} style={styles.link}>
              {reportUrl}
            </Link>
          </View>
        )}

        <Text style={styles.footer} fixed>
          {siteConfig.name} · {siteConfig.domain} · {siteConfig.email.contact}
        </Text>
      </Page>
    </Document>
  );
}

function renderV2Body(analysis: DiagnosisAnalysisV2) {
  return (
    <>
      <Text style={styles.sectionTitle}>Gargalo principal</Text>
      <View style={styles.gargaloBox} wrap={false}>
        <Text style={styles.gargaloArea}>{analysis.gargalo_principal.area}</Text>
        <Text style={styles.opportunityDesc}>
          {analysis.gargalo_principal.descricao}
        </Text>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Impacto estimado: </Text>
          {analysis.gargalo_principal.impacto_estimado}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Top 3 oportunidades</Text>
      {analysis.tres_oportunidades.map((op, i) => (
        <View key={i} style={styles.opportunityCard} wrap={false}>
          <View style={styles.opportunityHeader}>
            <Text style={styles.opportunityIndex}>0{i + 1}</Text>
            <Text style={styles.opportunityTitle}>{op.titulo}</Text>
          </View>
          <Text style={styles.opportunityDesc}>{op.descricao}</Text>
          <View style={styles.metaGrid}>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Complexidade: </Text>
              {op.complexidade}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Prazo: </Text>
              {op.prazo_implementacao}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Impacto: </Text>
              {op.impacto_estimado}
            </Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Plano 30 / 60 / 90 dias</Text>
      <View style={styles.planRow} wrap={false}>
        <View style={styles.planCell}>
          <Text style={styles.planLabel}>30 dias</Text>
          <Text style={styles.planText}>{analysis.plano_30_60_90["30_dias"]}</Text>
        </View>
        <View style={styles.planCell}>
          <Text style={styles.planLabel}>60 dias</Text>
          <Text style={styles.planText}>{analysis.plano_30_60_90["60_dias"]}</Text>
        </View>
        <View style={styles.planCell}>
          <Text style={styles.planLabel}>90 dias</Text>
          <Text style={styles.planText}>{analysis.plano_30_60_90["90_dias"]}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Próximo passo recomendado</Text>
      <Text style={styles.approachBadge}>
        {approachLabelsV2[analysis.proximo_passo_recomendado.abordagem]}
      </Text>
      <Text style={styles.opportunityDesc}>
        {analysis.proximo_passo_recomendado.justificativa}
      </Text>

      <Text style={styles.sectionTitle}>Alerta estratégico</Text>
      <View style={styles.alertBox} wrap={false}>
        <Text style={styles.alertLabel}>Atenção</Text>
        <Text style={styles.alertText}>{analysis.alerta_estrategico}</Text>
      </View>
    </>
  );
}

function renderLegacyBody(analysis: DiagnosisAnalysisLegacy) {
  return (
    <>
      <Text style={styles.sectionTitle}>Top 3 oportunidades</Text>
      {analysis.tres_oportunidades.map((op, i) => (
        <View key={i} style={styles.opportunityCard} wrap={false}>
          <View style={styles.opportunityHeader}>
            <Text style={styles.opportunityIndex}>0{i + 1}</Text>
            <Text style={styles.opportunityTitle}>{op.titulo}</Text>
          </View>
          <Text style={styles.opportunityDesc}>{op.descricao}</Text>
          <View style={styles.metaGrid}>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Impacto: </Text>
              {op.impacto_estimado}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Complexidade: </Text>
              {op.complexidade}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Prazo: </Text>
              {op.prazo_implementacao}
            </Text>
          </View>
          {op.ferramentas_sugeridas.length > 0 && (
            <Text style={[styles.metaItem, { marginTop: 4 }]}>
              <Text style={styles.metaLabel}>Ferramentas: </Text>
              {op.ferramentas_sugeridas.join(", ")}
            </Text>
          )}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Quick win (1 semana)</Text>
      <View style={styles.quickWinBox} wrap={false}>
        <Text style={styles.quickWinTitle}>{analysis.quick_win.titulo}</Text>
        {analysis.quick_win.passo_a_passo.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}.</Text>
            <Text style={styles.stepText}>
              {step.replace(/^\s*\d+\.\s*/, "")}
            </Text>
          </View>
        ))}
        {analysis.quick_win.ferramentas_necessarias.length > 0 && (
          <Text style={[styles.metaItem, { marginTop: 8 }]}>
            <Text style={styles.metaLabel}>Ferramentas: </Text>
            {analysis.quick_win.ferramentas_necessarias.join(", ")}
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Estimativa de retorno</Text>
      <View style={styles.roiRow} wrap={false}>
        <View style={styles.roiCell}>
          <Text style={styles.roiLabel}>Horas/mês</Text>
          <Text style={styles.roiValue}>
            {String(analysis.estimativa_roi.horas_recuperaveis_mes)}
          </Text>
        </View>
        <View style={styles.roiCell}>
          <Text style={styles.roiLabel}>Valor/mês</Text>
          <Text style={styles.roiValue}>
            {analysis.estimativa_roi.valor_estimado_mensal}
          </Text>
        </View>
        <View style={styles.roiCell}>
          <Text style={styles.roiLabel}>Payback</Text>
          <Text style={styles.roiValue}>
            {analysis.estimativa_roi.tempo_payback}
          </Text>
        </View>
      </View>
      {analysis.estimativa_roi.disclaimer && (
        <Text style={styles.disclaimer}>
          {analysis.estimativa_roi.disclaimer}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Próximo passo recomendado</Text>
      <Text style={styles.approachBadge}>
        {approachLabelsLegacy[analysis.proximo_passo_recomendado.abordagem]}
      </Text>
      <Text style={styles.opportunityDesc}>
        {analysis.proximo_passo_recomendado.justificativa}
      </Text>

      <Text style={styles.sectionTitle}>Alerta estratégico</Text>
      <View style={styles.alertBox} wrap={false}>
        <Text style={styles.alertLabel}>Atenção</Text>
        <Text style={styles.alertText}>{analysis.alerta_estrategico}</Text>
      </View>
    </>
  );
}

export async function renderDiagnosisPdf(props: Props): Promise<Buffer> {
  return renderToBuffer(<DiagnosisReportDocument {...props} />);
}

export function diagnosisPdfFilename(name: string, diagnosisId: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const idShort = diagnosisId.slice(0, 8);
  return `diagnostico-${slug || "lead"}-${idShort}.pdf`;
}
