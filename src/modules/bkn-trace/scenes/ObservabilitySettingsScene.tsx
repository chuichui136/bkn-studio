/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { Alert, Spin, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "@/modules/bkn-trace/scenes/ObservabilityWorkspace.module.css";
import { getTraceEvidenceConfiguration, listLogPolicies, listLogSources, updateTraceEvidenceConfiguration, type LogPolicy, type LogSourceStatus, type TraceEvidenceConfiguration } from "@/modules/bkn-trace/services/observability.service";
import { getAccessProfile } from "@/modules/bkn-trace/services/trace.service";

export function ObservabilitySettingsScene() {
  const { t } = useTranslation();
  const [sources, setSources] = useState<LogSourceStatus[]>([]);
  const [policies, setPolicies] = useState<LogPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string>();
  const [traceEvidence, setTraceEvidence] = useState<TraceEvidenceConfiguration>();
  const [traceEvidenceWrite, setTraceEvidenceWrite] = useState(false);
  const [updatingTraceEvidence, setUpdatingTraceEvidence] = useState(false);

  useEffect(() => {
    let active = true;
    getAccessProfile().then(async (profile) => {
		setTraceEvidenceWrite(Boolean(profile.traceEvidenceConfigurationWrite));
      if (!profile.globalLogSearch && !profile.logPolicyRead && !profile.traceEvidenceConfigurationRead) {
        if (active) { setDenied(true); setLoading(false); }
        return;
      }
      const [sourceResult, policyResult, traceEvidenceResult] = await Promise.allSettled([
        profile.globalLogSearch ? listLogSources() : Promise.resolve([]),
        profile.logPolicyRead ? listLogPolicies() : Promise.resolve([]),
        profile.traceEvidenceConfigurationRead ? getTraceEvidenceConfiguration() : Promise.resolve(undefined),
      ]);
      if (!active) return;
      if (sourceResult.status === "fulfilled") setSources(sourceResult.value);
      if (policyResult.status === "fulfilled") setPolicies(policyResult.value);
      if (traceEvidenceResult.status === "fulfilled") setTraceEvidence(traceEvidenceResult.value);
      if (sourceResult.status === "rejected" && policyResult.status === "rejected" && traceEvidenceResult.status === "rejected") setError(t("bknTrace.errors.queryFailed"));
      setLoading(false);
    }).catch(() => {
      if (active) { setError(t("bknTrace.errors.accessProfileFailed")); setLoading(false); }
    });
    return () => { active = false; };
  }, [t]);

  const updateTraceEvidence = async (enabled: boolean) => {
    if (!traceEvidence) return;
    setUpdatingTraceEvidence(true);
    try {
      setTraceEvidence(await updateTraceEvidenceConfiguration(enabled, traceEvidence.revision));
    } catch {
      setError(t("bknTrace.errors.queryFailed"));
    } finally {
      setUpdatingTraceEvidence(false);
    }
  };

  const sourceColumns: ColumnsType<LogSourceStatus> = [
    { dataIndex: "sourceId", key: "sourceId", title: t("bknTrace.settings.columns.source") },
    { dataIndex: "collectionMethod", key: "collectionMethod", title: t("bknTrace.settings.columns.collection") },
    { dataIndex: "coveredModules", key: "coveredModules", title: t("bknTrace.settings.columns.coverage"), render: (value: string[]) => value.join(", ") || "-" },
    { dataIndex: "status", key: "status", title: t("bknTrace.settings.columns.status"), render: (value: string) => <Tag color={value === "available" ? "green" : "orange"}>{value}</Tag> },
  ];
  const policyColumns: ColumnsType<LogPolicy> = [
    { dataIndex: "category", key: "category", title: t("bknTrace.settings.columns.category") },
    { dataIndex: "policyKind", key: "policyKind", title: t("bknTrace.settings.columns.policyKind") },
    { dataIndex: "retentionDays", key: "retentionDays", title: t("bknTrace.settings.columns.retention"), render: (value: number) => `${value} ${t("bknTrace.settings.days")}` },
    { dataIndex: "policyRevision", key: "policyRevision", title: t("bknTrace.settings.columns.revision") },
  ];

  if (loading) return <Spin />;
  if (denied) return <Alert message={t("bknTrace.errors.accessDenied")} showIcon type="warning" />;
  return <div className={styles.workspace}>
    <header className={styles.header}><div><Typography.Title level={3}>{t("bknTrace.settings.title")}</Typography.Title><Typography.Text type="secondary">{t("bknTrace.settings.description")}</Typography.Text></div></header>
    <Alert message={t("bknTrace.settings.readOnlyNotice")} showIcon type="info" />
    {traceEvidence ? <section className={styles.section}><Typography.Title level={4}>{t("bknTrace.settings.traceEvidence")}</Typography.Title><Typography.Text>{traceEvidence.operation ? t("bknTrace.settings.traceEvidenceOperation", { phase: traceEvidence.operation.phase }) : traceEvidence.effectiveEnabled ? t("bknTrace.settings.traceEvidenceEnabled") : t("bknTrace.settings.traceEvidenceDisabled")}</Typography.Text>{traceEvidenceWrite ? <Switch checked={traceEvidence.desiredEnabled} disabled={updatingTraceEvidence || Boolean(traceEvidence.operation)} onChange={updateTraceEvidence} /> : null}<Typography.Paragraph type="secondary">{t("bknTrace.settings.traceEvidenceRevision", { revision: traceEvidence.revision })}</Typography.Paragraph>{traceEvidence.services.map((service) => <Typography.Paragraph key={service.name}>{service.name}: {service.phase} ({service.readyReplicas}/{service.requiredReplicas})</Typography.Paragraph>)}</section> : null}
    {error ? <Alert message={error} showIcon type="error" /> : null}
    <section className={styles.section}><Typography.Title level={4}>{t("bknTrace.settings.sources")}</Typography.Title><Table columns={sourceColumns} dataSource={sources} pagination={false} rowKey="sourceId" /></section>
    <section className={styles.section}><Typography.Title level={4}>{t("bknTrace.settings.policies")}</Typography.Title><Table columns={policyColumns} dataSource={policies} pagination={false} rowKey={(record) => `${record.policyRevision}:${record.category}`} /></section>
  </div>;
}
