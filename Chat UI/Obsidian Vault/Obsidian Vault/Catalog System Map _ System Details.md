# Catalog System Map _ System Details

> [!INFO] Conversion Metadata
> **Source file:** `Catalog System Map _ System Details.xlsx`
> **Converted on:** 2026-05-11 at 14:47

---

## Sheet: Sheet1

| Team Name | Subsystem Name | POC Name | Purpose &amp; Capabilities | Upstream Data &amp; Sources | Downstream Data &amp; Consumers | APIs / Integrations | Ownership &amp; Escalation Matrix | Output Metric | Related Goals | Upcoming Changes / Priorities | Last Updated by GCO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CSS | Normalization | fsainula | The normalization system's primary purpose is to normalise the attribute values in a standardised, acceptable valid values that can be publisehd to catalog. It serves 2 key functions: (1) For structured attributes, the incoming payload is normalised based on Enumeration rules/mappings, and; (2) Derivation Logic - Derives attribute values from unstructured attribute data. It has different rules in DNS system depending on MP-PT-Att | This data comes to DNS system through sellers/vendors/feeds (contribution data) via Product KIS Workflow (this workflow is changing) | Recociliation systesm uses this data and than this data goes to item service | Data Ingestion and Standardization Services (DISS) | CSS - Prasanna SDM/ Feroz TPM
Escalation Matrix - SIM mechanism - (link to be shared by Feroz) | Earlier the team tracked Normalization rate however now they don't have a standalone metric, it feeds into CDQ | No specific goal, Feeds to SF uber goal as well as Variation CDQ | Introducing Agentic AI in 2026 to create normalisation rules automatically | 45887 |
| SM | External Product Data (EPC) | Principal PM: ramsvk@ | Stores data as SKU and the external website uses this data for classification. The system handles selection data from external sources and processes it through various stages before integration into the main pipeline. Multiple storage systems support different product categories including fashion and electronics, with each having distinct processing requirements. | Scrape | Matching | External Data Request Interface (EDRI API) - handles validation, reconciliation, and fulfilment of programmatic on-demand requests for selection discovery and brand artifact discovery | Amarjeet - Engineering
aloksg@ - EWC | % of E-commerce brands has Universal Brand Catalog (UBC) records
How fast can I discover any website data - Cycle Time | 1. Time to create ASIN post product discovery in 15days
2. What % of EWC websites we hjave data for | No | 45972 |
| CPP | Universal Feature Catalog (UFC) | deqian@ | UFC is part of CPP organization. It is a platform for computing and fetching ML features. It’s a centralized platform that accelerates ML application development for image and ASIN-based use cases. It provides a one-stop shop for computing and retrieving pre-computed ML features from Amazon and external catalogs. Data scientists can easily access product images, features, and models through different tools, enabling low-latency, cost-effective feature retrieval for model building.
 
UFC recognizes 2 user personas: 
→ Producers - engineers and applied data scientists who create and deploy ML features into UFC
→ Consumers - teams that leverage ML features from UFC for their own applications and services | ASIN to  image ID mapping - Sable scope - Authoritative source for  ASIN-to-image-metadata mappings and is related to Detailed Page ASIN Image  metadata updates from Twister (product of BuyX Design \|  Buying &amp; Offers Experience)
For product images, UFC obtains raw image from MSA (Media Services) and  external product images from S3
IOP CDW  team \| ChunkStore (system for storing catalog data updates and  providing snapshots) - UFC gets search &amp; ASIN signal  from ChunkStore which enriches catalog snapshots
Bring your own datasource - UFC  supports featurization but does not own or touch that data. | UFC produces ML features. It could be text in the image or Float array (data structure used in UFC to store ML features and embeddings extracted from images and other data sources). These features can be accessed through multiple patterns including online inference, offline async inference, and bulk inference via feature snapshots.

Systems that consume UFC data: 
CPP - Classification
Selection Monitoring - SM matching
IOP - Contribution Pipeline
PK - PT Classification 
Search M5 model customers
Amazon Visual Experience (AVX)
Product DNA (PDNA) model customers
CSS – Starfish | Andes
FeatureCatalogOnlineDataService: Provides low-latency (1x1) APIs for real-time feature ingestion and  consumption at record level
FeatureCatalogBatchDataService: Handles batch ingestion jobs for processing data from offline storage like  S3
FeatureCatalogStreamDataService: Enables near real-time feature streams for data ingestion and consumption
BatchFeaturizer Service: Provides asynchronous retrieval of features for large sets of  images and ASINs as csv files
 
External of ASCS: 
Amazon Visual Experience -  leverages UFC to detect whether the image contains some duplicate item, if  the image is illegal, or if the image contains some sensitive data. They  give UFC the model, UFC hosts the model, does the inference and these  unblock their use case. So basically they migrate the whole ML infra into  UFC.
Product  DNA \| SPS MLA team
M5 | UFC recently went through a reorganization and currently doesn't have a single owner. For the PMT, Safe AlKalouti (safalkal@) serves as the owner—he's essentially the face and business lead for UFC.

The highest-traffic service (UFC Batch Featurizer Service) is not a 24/7 service. However, services on contribution pipeline (e.g., Feature Catalog Service and Featurizer Façade Service) are 24/7 services.

Escalation path:
Feature Inference: raheesb -&gt; naval -&gt; onalan
Feature Catalog: rishibh -&gt;sankalpv -&gt; onalan
Feature Precompute(Contribution pipeline): andpec -&gt; naval → onalan | Cost  per ML feature inference
Volume of the ML feature that UFC produces | Cost  per ML feature inference. The goal is to reduce the cost for ML feature  (dollars per million features generated). 
Volume  of the ML feature that UFC produces.
Latency
SOA of  100 millisecond for Contribution Pipeline  | Current Priorities
1. P0 priority for UFC is the embedding feature excellence project. Current challenge in CPP is that classification models are repeatedly retrained, which takes time and money. Leadership recognized that not all the classification models are leveraged around the ML feature. The proposed solution is to use the M5 model to generate a single float array (compressed data representation) that can be plugged into all ML models as an input signal, rather than retraining models repeatedly. Key Benefits would be reduced model size, faster training time, lower inference cost. The goal for next year is to make ML features a &quot;first-class citizen&quot; for all classifiers, meaning that every model could integrate ML features before training or classification. This is a high priority VP/ELT-level goal. 
2. UFC is building Khoj, a similarity search engine for Amazon's catalog. The current State of Khoj is that it only works offline. It takes a file of ASINs and returns all ASINs similar to ASINs from the file submitted. Next Year's UFC P0 Khoj is to scale Khoj to support near real-time use cases (moving from pure offline to online). Why it’s important is that multiple teams need real-time similarity search for subsetting use cases or in matching SM, including finding similar candidates even outside of Amazon.
 
Upcoming changes: 
1. Change of ownership of ASIN to image ID mapping (not defined when and to whom).
2. System Rationalization Initiative (driving the re-org). Leadership questioned why ML feature inference and classification inference are separate when both are fundamentally ML inference. Solution is to create a single unified infrastructure for all inference with the goal to streamline the classification store and featurization store into a single API/unified experience. The purpose is cost savings and infrastructure consolidation (not deprecation). | 45958 |
| SCP | Catalog Landlording &amp; Issues (SCP-CLI)

Item Issue Store
Item Issue Refinery
Issue Data Lake | SDM: skwong@ | Catalog Landlording &amp; Issues (CLI) is a merged team combining Catalog Issue Authority (CIA) and Selection Management Experience (SMX). The team's primary function centers on being the feedback mechanism of the Catalog Pipeline to Seller Partners. The business purpose includes supporting processes and programs for creating, enhancing, validating, publishing, and analyzing descriptive item content, offers, editorial content, and relational content for Selection sold across Amazon's global marketplaces
 
CLI provides 2 products: 
Selection  Central - is an internal Amazon tool used to manage and landlord (oversee)  the product catalog. The platform serves as the central hub where internal  Amazon teams can control what customers see in the catalog. The user  interface displays ASINs, vendor contributions, and retail merchant  information, allowing users to submit changes either individually or in  batch to address various catalog-related issues. Essentially, it's the  primary platform where Amazon employees go to make adjustments and manage  product listings that appear to customers.
Catalog Issues - is the second product that functions as a comprehensive  validation system for the Amazon catalog. The platform allows catalog  validators and validations to emit errors or issues, which are then  captured by the system. The team works with multiple experiences and  platforms, including Selection Central, Seller Central, Vendor Central,  and listing APIs, to ensure all identified issues are properly  communicated back to the selling partner. This creates a closed-loop  feedback system where selling partners submit data to the catalog, which  then gets processed, evaluated, and validated. If any issues are detected  during this process, selling partners can now self-service and see these  issues directly, allowing them to address problems with their catalog  submissions independently. | Selection Central 
The primary source is CC-API, which provides all the contribution data.
Variety of data from item processing to provide comprehensive information. This  includes identifying whether a contribution is a data augmenter and  determining the various states of an ASIN. To render all the product  attributes properly, Selection Central uses UMP.
To establish the relationship between contributions and items is accomplished  through Xref.
 
Catalog Issues 
CC-API. When a submission goes through CC-API, it passes through various systems in the pipeline, each checking for potential problems. These systems, referred to as validators, function as plug-ins throughout the pipeline and emit issues whenever problems are detected. All the issues generated by these validators flow back through the pipeline and are ultimately stored in the issue store. 
Essentially, Catalog Issues consumes validation results and error data from all the validator systems in the catalog processing pipeline, consolidating them into a centralized issue store for tracking and resolution. | Selection Central
CC-API - When users take action, they submit data back  to the catalog, which flows into CCAPI. CCAPI serves as the main  downstream system, and from there the data flows to different parts of the  catalog system.

 Catalog Issues
 Issues are vented to experiences like Seller  Central and Vendor Central for display to selling partners. Catalog Issues  doesn't resolve the issues themselves; they collect issues in the issue  store and distribute them to SPS (Selling Partner Support), who displays  them to selling partners. Selling partners then take action by submitting  fixes or new data back into the catalog. These new contributions flow  through the catalog again and get evaluated, potentially clearing the  original issues and completing the feedback loop. | Selection Central 
CC-API 
UMP
Xref - ASIN-to-SKU mapping API 
 
Catalog API
CC-API | Owner: skwong@
CLI is supported by an on-call rotation system where  engineers provide 24/7 support. When critical issues arise, the engineer  currently on-call receives a page notification and is responsible for  resolving the issue. | The primary KPI is contact reduction
Reduce catalog friction with SP | The primary KPI is contact reduction, specifically  measuring how effectively the team reduces the volume of contacts from  selling partners. This is tracked through issues reported, interactions  via Selection Central, and the team's overall work output. The team also  monitors data augmentation governance as a KPI, which measures how  internal actors are submitting data to the catalog and tracks the types of  submissions and actions they're performing.  | No upcoming changes in near future. | 45959 |
| SCP | Contribution Catalog API | SDM: sumike@ | Within the Contribution Pipeline, the Contribution Catalog API (CCAPI) is intended to be the authoritative store of contributors’ MCID/SKU-keyed data (contributions) to Amazon’s catalog, and issues related to them. It is the unified ingestion point to catalog systems and the only way to write durable content to the catalog for MCID/SKU-keyed data regardless of type of contributor. | Seller Central, Selection Central, Vendor Central, Any Contribution API, Seller Feeds | Refinery, Shield | https://w.amazon.com/bin/view/GRCS/Reconciliation/Projects/ContributionAPI/APISpecification#Resource_structure | Owner - Mike
CTI - Contribution Catalog (ttps://cti.amazon.com/cti/category/Retail%20Catalog/type/Services/item/Contribution%20Catalog%20Service) | Processing Latency - Pre defined SLA 
Error Rate in Latency (Response Time) | PLE, Deprecate submission manager, Catalog Undo (Reversing the wrong data to right) | WIP |  |
| SCP | Reconciliation | SDM: kanikaak@
 | Reconciliation's core purpose is generating a unified item view by taking all matched contributions for an ASIN and selecting winning values per attribute based on contributor rankings. The system operates through three main APIs: global item reconciliation, FCD domain reconciliation, and enrichment reconciliation. | Contribution Pipeline (Domain Director) | Global Item processing Workflow in Item Pipeline | Reconciled Item - Reconciles globally
Enrichment
FCD Reconciliation | Owner - Kanika
CTI - https://t.corp.amazon.com/issues/?q=extensions.tt.status%3A%28Assigned%20OR%20Researching%20OR%20%22Work%20In%20Progress%22%20OR%20Pending%29%20AND%20extensions.tt.assignedGroup%3AReconciliation  
CTI - https://t.corp.amazon.com/issues/?q=extensions.tt.status%3A%28Assigned%20OR%20Researching%20OR%20%22Work%20In%20Progress%22%20OR%20Pending%29%20AND%20extensions.tt.assignedGroup%3A%22Reconciliation-Dev-Only%22
On call - https://oncall.corp.amazon.com/#/view/scp_recap_onduty/schedule  | Error Rate from reconciliation
Failures within the Recon system
Latency - How long it takes to reconcile | Brand Elevation for TK brands - Giving brand the power to win recon contributions | Elevating all the retail brands
2. Brand Representative Starfish - All the branded ASINs will only consider brand or SF contributions | 45973 |
| IRP | Relationships PreMatching Workflow | yezutov@  | The DomainContributionRules is a pre-matching activity that validates and manipulates attribute data. These validations and manipulations are conducted by performing evaluations against a set of nova rules specified to be applied at the contribution level. RM, specifically, owns a subset of these rules pertaining to modify the deprecated_variation_theme, generate variation_dimension_order, generate bundle_components_key (pre-matching) and validate variation themes. | Contribution Pipeline | Relationships PostMatching Workflow | Brand Authority, Normalisation, Title services, Contribution supression, Catalog relationship pipeline, Prematching plugin
* Plugin for each API explained in details in quip | Classification and Policy Platform (CPP) - sc_policymanager
Catalog Scoping Services - scp-css-oncall-pri
browse-assignment - page-browse-assignment
undefined - undefined
Catalog Relationship Services - catalog-relationships-services
IMS-Platform - ims-platform
Asin Localization - localization-dev-primary
pedal-dev-24-oncall - pedal-dev-24-oncall
Contribution Pipeline (IOP) - contributionpipeline
Catalog Correctness Systems - ascs-css-correctness
items_security_privacy - page-items-security-privacy-oncall
Data Normalization Services - diss
Contribution Pipeline - contributionpipeline
International Technologies - a2i-cx-race
Catalog System Services - grcs_itemservices_onduty
Catalog Relationship Pipeline - iop-relationships
Classification and Policy Platform - cpp-crisp-oncall
Selling Partner Services - ocicat-oncall |  |  | Changes to the system can be validated through updates to plugins in the plugin platform. | 45973 |
| IRP | Relationships PostMatching Workflow | yezutov@  | The RM team's current logic, implemented via a nova rule, ensures a contribution's variation theme matches the reconciled item when a SKU is matched to an ASIN. Similarly, another nova rule validates compatible variation themes during merge operations. The IP team is developing a new contract for the incoming contribution and matched item, which will be executed post-matching. The relationships team will then implement a new workflow to validate the incoming SKU's variation theme against the matched item's variation theme. | PreMatching Workflow | Relatioship Item Enrichment  | Identity protection, Product reconcilation, Item relatioship processing, Issues Actuator, Item relatioship processing, Post Matching Plugin
* Plugin for each API explained in details in quip | CPPAbusiveListing - Classification and Policy Platform - sc_policymanager
CPPProhibitedMarketing - Classification and Policy Platform - sc_policymanager
CVSPostMatchingCorrectness - undefined - undefined
CVSPostMatchingGenDataGuardrails - Catalog System Services - grcs_itemservices_onduty
ContributionAuthorizationService - IMS-Platform - ims-platform
IdentityProtectionService - Classification and Policy Platform (CPP) - sc_policymanager
ItemIdentityAttributesAnnotator - Platform Matching - itemauthority
PSCComplianceCatalogEnricherService - SPX - Tech - pars-spx-tech
ProductAttributeEnforcerService - Catalog Risk Monitoring - catrisk-primary
UnstructuredAttributeQualityService - Classification and Policy Platform (CPP) - sc_policymanager
VerifiedBarcodeAsinMapper - gmt-sea-cats - gmt-sea-cats-oncall  |  |  | Changes to the system can be validated through updates to plugins in the plugin platform. | 45973 |
| IRP | Relatioship Item Enrichment  | yezutov@ | The Relationship Enhancement and Validation (REV) team manages guardrail systems that ensure relationship quality across Amazon's global catalog. They own and maintain validators in both item and contribution pipelines, enhancing catalog data quality to deliver seller and buyer experiences. The REV team actively monitors relationship quality, identifies potential seller abuse patterns, and implements strategic improvements to maintain catalog integrity |  |  | Item - Before Locking
Item - Pre Reconciliation
Item - Reconciliation
Item - Post Reconciliation
Rel - Pre Reconciliation
Rel - Reconciliation
Rel - Post Reconciliation
Item Persistence | CPPUpstreamEvaluationPlugin - IMS-Platform - IT Dev/Selection Classification/Policy Evaluation Autocuts - ims-platform
CRPItemEnrichmentRelatedEntityViewService - iop-relationships - IT Dev/Item Relationships Management/AutoCuts - iop-relationships-oncall
DNSItemEnrichment - Data Normalization Services - Catalog/Enrichment/Runtime Engines - dnss
DRSPlugin - intense - InTech/INTense/DRS Plugin - intense-oncall-primary
GlobalItemRulesPlugin - gip-oncall - IT Dev/Item Pipeline/AutoCuts - gip-oncall
ItemCompletenessValidation - Catalog System Services - Catalog/Validation/Item Pipeline Integration - grcs_itemservices_onduty
ItemCorrectnessValidation - Catalog System Services - Catalog/Validation/Item Pipeline Integration - grcs_itemservices_onduty
LocalizationItemPluginService - International Technologies - Catalog/ASIN Localization - Internal/ItemPlugin - localization-dev-primary
StructuredTransformationItemEnrichment - browse-assignment - Catalog/Structured Transform/Service - page-browse-assignment
UnifiedScopingItemEnrichment - browse-assignment - Catalog/Scoping/Autocut - browse-assignment
Each entry now follows the format: Component Name - Team Name - Category/Type/Item - Oncall Alias |  |  |  |  |
| IRP | Relationships Contribution Processor Workflow | yezutov@  | The Relationships Contribution Processor Workflow is a new workflow being designed to separate the relationships team owned activities from the item pipeline team owned activities in the contribution processing pipeline. |  |  |  | CRPSkuChildToParentIndexService
ContributionViewsReconciliationPlugin |  |  |  |  |
| SCP | RCR | SMD: mnyounsi@ | RCR is the temporary host for Retail Identities mapping (name, code, contributor id, etc.) until a new better identity model is established. It hosts configuration for retail reconciliation, i.e. domain subscriptions and precedence scores. | Conway | Refinery, Retail Pipeline, CCAKS |  | SMD: mnyounsi@
Sr Mgr: jmahajan@
Issues Troubleshooter: [Retail Catalog\|Services\|Retail Contributor Registry Service] and [Retail Catalog\|Services\|[Autocut] Retail Contributor Registry Service] | Request per client, Request per operation, Request latency p90 |  |  | 45974 |
| SCP | Refinery | SDM: ptrfrank@ | Contributor Refinery serves as the intent detection and workflow orchestration system for catalog changes. When sellers make catalog modifications (such as title or price updates), Refinery analyzes the differences between current and previous states to determine seller intent and creates corresponding workflows for downstream processing 

Capability - Detect the Selling Partner's intent of their catalog item change (e.g. title, price, etc...), and construct the corresponding workflow, so that the change can be processed by the Catalog Pipeline. The role of a Contribution Refinery is to pass contributions made to the Contribution Catalog Store to Sidewinder. | Contribution Catalog API, Contribution Catalog Stream Processor | Contribution Catalog History, Contribution Search &amp; Sidewinder, Contribution Issue Archiver | No API, It's a pipeline data processor (data in, data out).

That said, in 2024 we've built the Turbo service (https://w.amazon.com/bin/view/SCP/ContributionCatalogComponents/Services/ContributionTurbo) which exposes an API endpoint on Refinery. This allows execution of Catalog Pipeline processing syncrhonously in a matter of seconds, rather than hours, for fast UX-driven interactions by Selling Partners. This is much lower TPS (up to 600), vs the &quot;normal&quot; Refinery's 300K TPS | SCP - SDM - ptrfrank@
SCP - Sr Mgr: langmead@
On Call: mysleru@
CTI: Retail Catalog / Pipeline / Contribution Catalog Refinery | Data Availability, throughput rates, and dependency health | 2025
Progressive Listigns Experience
Contribution Authority
IOS - Item and Offer Split

2026
TBC | Contributor Refinery will continue operating in its current form without planned architectural changes. It will continue to undergo internal simplifications | 45974 |
| SCP | CCAKS | SDM: ptrfrank@ | The Contribution Catalog Alternative Keys Service (CCAKS) is a standalone service that sits in front on the existing Contribution Catalog Service. The Contribution Catalog Service is a Contributor / SKU based service. The purpose of CCAKS is to provide alternatively keyed interfaces to existing CC operations. CCAKS will handle the translation from the exposed alternative keys into Contributor / SKU and call into the existing CC Service. | Realtime Item Processor - Services; Retail Pipeline, RCR | CCAPI, Data Services | XREF | SCP - SDM - ptrfrank@ | SLA - latency, avaialbility
Non-functional service metrics (CPU, memory, etc..)
Downstream dependency metrics 

See CCAKS dashboard for more https://w.amazon.com/bin/view/SCP/ContributionCatalogComponents/Services/CCAKS/Dashboard/ | CCAKS deprecation. 2026 we start exploring most likely - currently BTL -, and maybe deprecate it in 2027. Currently unclear | CCAKS faces deprecation within the next five years, with the team still determining appropriate replacement strategies. | 45974 |
| SCP | Contribution History | SDM: ptrfrank@ | The Contribution History is a component of the Contribution Catalog pipeline that stores all versions of a 1P Vendor contribution data history. It does not store history for 3P Data.
There are three main use cases for history: 
Operational investigations - Contribution History provides visibility on the evolution of the content of the Contribution Store, on a per-contribution basis. This improved visibility makes it easier supporting and responding to user queries as the catalog grows in size. 
Rollback - Even though it is not the responsibility of the Contribution History to implement rollback semantics, its integration in the contribution pipeline enables CC-API to provide the mechanism with which clients may search for and then pick past versions of their contributions to rollback to. 
Restoring Data - very useful for restoring data in case of data corruption or data loss in the 1P Vendor space | Refinery | CCAPI (read only) |  | SCP - SDM - ptrfrank@

CTI: Retail Catalog / Services / Contribution History Service | see here https://w.amazon.com/index.php/SCP/RECAP/Products/ContributionHistory/Operations/Dashboard/Service/Prod/Overview | Deprecation, currently unfunded | Contribution History may be deprecated in 2026, though replacement planning remains in progress. | 45974 |
| SCP | Contribution Search | SDE: bugnar@ | Contribution Search sits between the CC API and various upstream data sources in the catalog pipeline. When clients need to search contributions by criteria other than contributor ID and SKU, CC API forwards requests to Contribution Search, which returns matching keys that CC API then uses to retrieve full contribution data from DynamoDB. The system processes updates from Refinery whenever contribution data changes and also indexes issues that occur at the ASIN level after reconciliation, linking them back to related contributions.

The system serves as a search engine for existing catalog data but does not own or modify the underlying contribution data. Contribution Search currently runs on OpenSearch 1.0 with plans to upgrade to version 2.0 for improved availability, security, and cost optimization.  | Refinery, IDS | CCAPI, Seller Central, Vendor Central

All client interactions occur through CC API, maintaining abstraction from the underlying search infrastructure | Contributo_ ID/SKUs | SCP - SDM - sdamera@

On Call - https://oncall.corp.amazon.com/#/view/scp-cdd-oncall 
CTI - https://cti.amazon.com/cti/category/Retail%20Catalog/type/Search | Latency &amp; Ratio of success vs unsuccessful requests | None | Improve the system internally to improve the success rate of requests and reduce latency issues, no changes at system level/placement 

System  will undergo OpenSearch version upgrade from 1.0 to 2.0 while maintaining  transparency to external clients | 45975 |
| SCP | Sidewinder | SM: msanjum@ | Sidewinder serves as a critical intermediary system between customer-facing APIs (SPS) and downstream processing systems (IRP). The system receives 25-30K transactions per second but is limited to dispatching 15K TPS to downstream systems due to capacity constraints. The system implements sophisticated traffic shaping beyond basic throughput control, identifying expensive operations like large family relationship updates and limiting them to smaller quotas (4-5K TPS) within the overall 15K limit. Sidewinder includes optimization features such as update consolidation for multiple operations on the same key and maintains ordering guarantees to prevent out-of-sequence processing. This system acts as a buffer, managing backlog and ensuring smooth traffic flow while preventing downstream system overwhelm. The system sits between catalog contribution APIs and IRP pipeline, handling the orchestration of catalog updates through workflow engines.

Priority Management - Sidewinder implements a four-tier priority system to manage traffic flow. Priority 1 handles UI updates requiring immediate response, Priority 2 processes API integrations and bulk feeds with 1-2 hour expectations, Priority 3 manages internal team submissions including data augmentation, and Priority 4 handles housekeeping jobs. Amazon's own traffic (Amazon Digital, Amazon Music) receives special handling due to legal requirements preventing prioritization against third-party seller traffic.  | Refinery | AARHs | Self contained system which doesn't use any API | SCP - SDM: msanjum@ | High throughput and low latency | Availability - Latency and Technical error rate reduction | None. Some optimizations will be done to the existing system which will be discussed in OP2 cycle | 45979 |
