# Starfish Vanguard SOP V7

> [!INFO] Conversion Metadata
> **Source file:** `Starfish Vanguard SOP V7.docx`
> **Converted on:** 2026-05-18 at 11:56

---

#                                            Starfish Vanguard SOP V7

|  A|

B

C

D

E

F

1

**Version**

**Details**

**Updated By**

**Updated Date**

**Sign off by**

**Sign off Date**

2

**V1**

**Starfish Vanguard SOP Created**

Tanush Gopal Krishna

**10/9/2024**

|  |  |
3

**V2**

**Starfish Vanguard SOP V2**

Tanush Gopal Krishna

|  |  |  |
4

**V3**

**Starfish Vanguard SOP V3**
**Updated URL ASIN Mismtach Audit Section**

Tanush Gopal Krishna

**11/4/2024**

|  |  |
5

**V4**

**Updated PT Misclass logic and Image Number**

Tanush Gopal Krishna

**1/6/2025**

|  |  |
6

**V5**

**Updated with "Incorrect & Not Obtainable" & "Tombstone" in Auditor Decision **
**Updated the workflow flowchart**

Tanush Gopal Krishna

**3/20/2025**

|  |  |
7

**V6**

**New Attribute Types (Nested & Type Hard Enumerated)**

Tanush Gopal Krishna

**4/7/2025**

|  |  |
8

**V7**

**Updated With DP Text Source & Sources for Blocked PTs & Brands**

Tanush Gopal Krishna

**8/21/2025**

|  |  |

### Important Links

|  A|

B

1

**Description**

**Link**

2

Applicability examples

link

3

Edge Cases

link

4

Normalization examples

link

5

PT Misclass examples

link

6

Incorrect & Not Obtainable

link

7

Attribute updates

link

### Contents

- **Objective**
- **Vanguard-Starfish Program Background**
- **Workflow Flowchart**
**Overview on the workflow for Starfish Vanguard.**
- **Data Sources and their order of search**

- **Attribute Types**
- **Search techniques **
- **Appendix**

## **1. Objective:**

The objective of this document is to have a standard correction mechanism for the attributes. This document focuses (1) How/where to find the correct value for a specific structured attribute using internal tools and external search engines.(2) How to correct them using available tools.

## **2. Vanguard-Starfish Program Background**

In 2024, we aim to elevate Catalog Data Quality Management (CDQM) from a baseline of approximately 17% to 90% of the top 90% GV Weighted ASINs across all PTs WW. Despite concerted efforts in Q1 and Q2 to enhance the quality of the regeneration model, progress in CDQM has been slower (CDQM Score of 14% against a ramp of 20% in March & 16.27% GV weighted ASIN’s regenerated ) than anticipated, posing a risk to customer experience (CX) due to the lag in regeneration model quality.

To address this issue, Starfish Vanguard will specifically focus on supporting CDQM improvements through targeted manual interventions for high-impact, low-quality ( Grade C / Grade D )ASINs. By addressing these quality deficits directly, Vanguard for Starfish will provide crucial data and insights to refine the regeneration and quality models, thereby accelerating overall model quality improvements and helping in taking the CDQM score closer to the Starfish goal.

 

The Vanguard for Starfish program is essential to ensure that our commitment to superior catalog data quality is upheld while the regeneration model enhancements catch up on Starfish Goal to deliver an LLM that achieves >90% High-Quality Composite Quality Score on ASIN regeneration.

## **3. Workflow Flowchart**

> [!NOTE] Image 1 — OCR extracted text (confidence: 83%)
> Open Audit Balch in AMS
> ‘Audit Template with ASIN_Attribute
> information is loaded
> Validate catalog value
> {fom DP/Brand/BI(
> YES
> No:
> is Catalog Value
> Correct
> is Correct Value
> Obtainable
> NO
> YES
> l
> No-
> ¥
> ¥
> ‘Take Decision as Correct
> ‘Add Source
> ‘Take Decision as Incorrect
> ‘Add value to Ground Truth & Source
> /        / ‘Take Decision as Incorrect & Not Obtainable /          /    ‘Take Decision as Unable to Validate    /
> is Attribute
> is PT Misclass.             NO"                                                         is Catalog Value                                      -NO-
> Applicable              sch
> ves                No                ves
> |                |                 1)|
> ‘Take Decision as                            Take Decision as                          Identify the correct value
> PT Misclass                                     Not Applicable                                  from DP/Brand/BIC
> Value is found                              NO—————
> ves
> ‘Take Decision as Incorrect
> Add value to Ground Truth & Source
> Take Decision as
> Not Obtainable

### **3.1 Overview of the workflow for Starfish Vanguard.**

- **Step 1 : **Open the allocated initial batch in AMS, which contains ASIN Attributes to be audited.
- **Step 2** :
Refer the Attribute definition on AMS to understand the PT - Attribute 
- Refer the Attribute Type on AMS to understand the kind of data that is expected for that specific attribute 
- Refer the example valid values which will help you understand the acceptable input for a given attribute

- **Step 3 : **Evaluate if the ASIN in audit belongs to the mentioned Product type
If the ASIN is misclassified under the incorrect Product type then select “PT Misclass” in Auditor Decision 
 Ensure to identify PT misclassified ASINs by reviewing PT definitions/scope note available in  CATUI//Graph Viewer Tool - link.
- Identify keywords from the DP and search in Graph Viewer tool by selecting the *product-categories* path.
- The suggestion of the correct PT should be of Pathfinder PTs.
-  Auditors are advised to verify two things: the PT is in production and that it is a Pathfinder PT. 
- Examples for reference is provided in the link.

- If its the correct Product type to Step 4

- **Step 4** : Evaluate the Applicability of that Attribute in relation to the ASIN in audit 
If attribute is not applicable then select “Not Applicable” in Auditor Decision 
- If attribute is Applicable go to Step 5

- **Step 5** : 
**If the Catalog Value is Blank:**
Search for the correct value using the priority order from section 3.2.
- Select "Incorrect" in Auditor Decision, add the found value to the ground truth and select the source.
- If no value is found, Select "Not Obtainable" in Auditor Decision

- **If the Catalog Value is Not blank:**
Validate value using the priority order from section 3.2.
- If the value is Correct  
Select "Correct" in Auditor Decision and select the source.

- If the value is Incorrect
Select "Incorrect" in Auditor Decision
- Add the correct value to the ground truth and add the source.

- If the value is incorrect and the correct value is not obtainable, Select "Incorrect & Not Obtainable" in Auditor Decision 
- If the value can't be validated (i.e. not sure if its correct or incorrect) , Select "Unable to Validate" in Auditor Decision 

- **Step 5** : Click on Submit and move to the next ASIN Attribute

**Scenario's : **

- 
**ASIN/URL Mismatch**: Different ASIN ID in Audit and DP, Follow Regular audit steps with Priority Order from section 3.3. In Rationale add “ASIN Mismatch”.
- **Tombstone ASIN**: Select “**Tombstone**” in Auditor Decision.

**Important Pointers:**

- Add links in Comments section whenever the value is taken from external sources such as Brand/BICs
- Add Rationale whenever the value is inferred using Common/General knowledge and human judgment. 
- Add Image Number when source is ‘DP Image’

### **3.2 Data Sources and Priority**

- **Amazon DP** : 
DP Images
- DP A Plus Content
- DP Text  - Unstructured Content (Title, Bullet Points & Product Description)
- DP Text  - Structured Content (Feature Bullets, Technical Details & Product Information) - **Use only when Catalog Value is Empty**

- **Brand Website**: All Sections of Brand Website (Images, A Plus & Textual) have the same weightage 
- **BIC ( Best in Class) Website**: 
Images
- A Plus Content
- Unstructured Content (Title, Bullet Points & Product Description
- Structured Content (Feature Bullets, Technical Details & Product Information)

**Important Pointers:**

- In Amazon DP, Both Images & A Plus hold the same weightage
- If the value is not available Amazon DP Images/A Plus and information is conflicting between sections of Amazon DP textual content, use Brand/BIC has tie breaker to attain the value.
- BIC Recommendations - Best-in-Class Product Information (Reference Purpose only)

### 3.3 **Data Sources and Priority for ASIN Mismatch(URL Mismatch)**

- **AMS /CP Central Info** : 
AMS Images
- Unstructured Content from AMS (Title, Bullet Points & Product Description)

- **Brand Website**: All Sections of Brand Website (Images, A Plus & Textual) have the same weightage 
- **BIC ( Best in Class) Website**: 
Images
- A Plus Content
- Unstructured Content (Title, Bullet Points & Product Description
- Structured Content (Feature Bullets, Technical Details & Product Information)

***At any point of time do not rely on DP as a source for URL Mismatch ASINs. If there is a requirement to check and infer values basis variation of the product, necessary info would be present on item_name itself. Refrain from deriving/inferring values from DP. Ex: If there is a req. to check size of the product and infer values from size chart, do not rely on the information present on DP instead pick size value from item_name and infer values from size chart.***

### 3.4 **Data Sources and Priority for Batches with Blocked Brands & Blocked PTs**

- **Brand Website**: All Sections of Brand Website (Images, A Plus & Textual) have the same weightage 
- **Amazon DP** : 
DP Images
- DP A Plus Content

## 5. Attribute Types

|  A|

B

C

D

1

**Old Nomenclature**

**New Nomenclature**

**Description**

**Attribute example**

2

Boolean

Boolean

For Boolean Attributes value should be suggested only true/false.

is_electric,  has_lid

3

Hard Enumerated

Hard Enumerated

Hard enumerated attributes possess a predefined set of machine-accepted valid values, and any values beyond this set are not permissible. The term "hard enumerated" stems from this strict limitation, to maintain uniformity. During attribute auditing, auditors must adhere to the established set of accepted values for these attributes. The attributes which are tagged as Enumerated in the Metadata are considered as Hard Enumerated attributes and the values suggested should be the same as it in the G2S2.

target_gender, diet_type

4

Hard Enumerated

Complex Hard Enumerated

Complex attributes which are Hard Enumerated are considered as Complex Hard Enumerated.

battery.capacity

5

Unit Hard Enumerated

Complex Numeric with units

Complex numeric attribute with units are the attribute values where its both a complex attribute and has a Numeric value with units

display.size

6

Unit Hard Enumerated

Numeric with units

Numeric attributes with units associated with it.

voltage

7

Numeric

Numeric without units

Numeric attributes without units associated with it.

number_of_compartments

8

Numeric

Complex Numeric without Units

Complex numeric attribute without units are the attribute values where its both a complex attribute and has a Numeric value without units

thread.count

9

Not Hard Enumerated

Simple String

The attributes which are tagged as String in the Metadata are considered as Simple Attributes

form_factor , target_audience, ruling_type

10

Not Hard enumerated Enumerated

Complex String

Its known as complex attribute because the main attribute name will have sub attributes along with it listed in the same page.

closure.type

11

NA

Nested Attribute

Parent Attributes with Child attributes are termed as Nested Attributes

nutritional_info
apparel_size 

12

NA

Type Hard Enumerated

Attributes with Type and Quantity/Range are termed as Type Hard Enumerated.
Type value is Hard enumerated and Quantity/Range is either numeric or string

num_batteries
usb_port_quantity 
expanded_iso_range

## 6.Links to Examples:

|  A|

B

1

**Description**

**Link**

2

Applicability examples

link

3

Edge Cases

link

4

Normalization examples

link

5

PT Misclass examples

link

6

Incorrect & Not Obtainable

link

7

GCO Notifier updates

link

### 6.1  Useful Online Tools

- Storage Volume / Capacity : https://www.sensorsone.com/length-width-and-height-to-volume-calculator/
- Unit Convertor : https://www.unitconverters.net/

## **7.Search Techniques**

- **Brand+ Model name  from Title : **From Title of the product select only brand name and model number or model name and search to get the Brand and BIC sites.
- **Image – Search image on google**

Right click on image and select search image with Google to find similar product images.

> [!NOTE] Image 2 — OCR extracted text (confidence: 87%)
> @ CSITOOL @ METADATA 4 EnDtool ¢&3% Catalog Admin Cent.. &, phone tool
> DP ASIN: B092ZCW2XZ
> |          Open image in new tab|
> Home & Kitchen » Bath » Bath Rugs
> Save image as...
> Copy image
> Copy image address
> Create QR Code for this image
> Search image with Google
> 2a Amazon Enterprise Access         >
> C-Ops Assistant                 >
> Inspect
> Click image to open expanded view
> 7 PEER EER wm (iN) =.
> C:| SAP Concur Home|
> @" Allsec Technologies  @ Variations Tool
> Arotive Luxury Chenille Bathroom
> Rug Mat, Extra Soft Thick
> Absorbent Shaggy Bath Rugs, Non-
> Slip Machine Wash Dry Plush Bath
> Mats for Bathroom, Shower, and
> Tub (24"x16", Navy)
> Targeted Research
> Visit the Arotive Store
> 4.5 dekh hole v
> @ 1 sustainability feature v
> 7,798 ratings
> 300+ bought in past month
> -6% 51499 s529/5q1)
> List Price: $46:99 @
> FREE International Returns v
> No Import Fees Deposit & $13.69 Shipping to Ireland
> Nataile  @ Image Assist
> »          [3 All Bookmarks
> Powered By C-Ops Assistant
> $1499 5.201591)
> FREE International Returns wv
> No Import Fees Deposit &
> $13.69 Shipping to Ireland
> Details v
> Delivery Friday, October 25.
> Order within 21 hrs 29 mins
> Or fastest delivery Friday,
> October 18
> © Deliver to Ireland
> In Stock
> Quantity: 1             v
> Add to Cart
> Buy Now
> Ships from Amazon
> Sold by      Arotive

- **Targeted research in C-Ops **

Enable the monkey widgets in C-Ops then targeted research is visible on the DP.

> [!NOTE] Image 3 — OCR extracted text (confidence: 79%)
>  Cc 25 amazon.com/dp/B092ZCW2XZ?pd_rd_i=B092ZCW2XZ&pf rd_p=0ec94899-b0d8-4fa7-8fe3-3c09a46184e18&pf rd_r=QNECF29PF896N6SQ...  ¥¥  a 9  =   :
> L         “& EnD tool  sz Catalog Admin Cent...   phone tool   2   oncur Home  @° Allsec Technologies   Variations Tool   Image Assist        »     All Bookmarks
> CSI TOO   META DATA 4 EnDtool &% Catalog Admin C     h   |   SAP C     2" Allsec Technologi    iations Tool     A           [3 All Bookmark:|
> DP ASIN: B092ZCW2XZ                                                                                                                                                                                                                    Powered By C-Ops Assistant
> Home & Kitchen » Bath » Bath Rugs
> Arotive Luxury Chenille Bathroom
> Rug Mat, Extra Soft Thick
> Absorbent Shaggy Bath Rugs, Non-     eines sssHlonodi
> Slip Machine Wash Dry Plush Bath      $13.69 Shipping to Ireland
> Detail
> Mats for Bathroom, Shower, and         And
> $1 4% ($6.29 / Sq ft)
> FREE International Returns wv
> Tub  (24"x1 6",  Navy)                                        Order within 21 hrs 29 mins
> Or fastest delivery Friday,
> Targeted Research                                                        October 18
> Visit the Arotive Store                                                      © Deliver to Ireland
> 45 dekh kd v 7,798 ratings                             In Stock
> @ 1 sustainability feature v
> 300+ bought in past month                                                          Quantal                      id
> Add to Cart
> -6% $14 5.207591
> List Price: $45-99 @                                                                            Buy Now
> oo     RN      -        RB                                FREF Intfarnatinnal Ratiirne sr

Click on Targeted research and select the required search and submit. This will directly show brand sites.

> [!NOTE] Image 4 — OCR extracted text (confidence: 81%)
> «€ > C    25 amazon.com/dp/B092ZCW2XZ?pd_rd_i=B092ZCW2XZ&pf rd_p=0ec94899-b0d8-4fa7-8fe3-3c09a46184e18pf rd_r=QNECF29PF896N6SQ... Vx    a &    =   :
> ® CSITOOL  @ META DATA  “& EnDtool ¢&3 Catalog Admin Cent...   {, phone tool SAP Concur Home ~~ @" Allsec Technologies  @ Variations Tool ~ @) Image Assist               »     3 All Bookmarks
> ECC Classification
> $149 $5.20 5q1)
> Preferred Search Patterns:                                                                                                   FREE International Returns wv
> No Import Fees Deposit &
> +
> Manufacturer + Model no.                                                                                                  $13.69 Shipping to Ireland
> [J Manufacturer + Title + Model no.                                                                                      Details v
> [J] Title + Model no.                                                                                                          Delivery Friday, October 25.
> 0 M     fact      + Titl                                                                                                               Order within 21 hrs 29 mins
> anufacturer + Title
> [J] Brand + Model no.
>  Brand + Title + Model no.
> [J] Brand + Part Number
> Or fastest delivery Friday,
> October 18
> © Deliver to Ireland
> [) Brand + Title + Part Number                                                                                     In Stock
> (] Title + Part Number                                                                                           Quantity: 1               v
> [] Title
> Add to Cart
> [J EAN
> [J] Manufacturer + EAN
> [1 EAN 4 llear Kavnanard
> Ships from Amazon
> Sold by      Arotive

## 8. Appendix:

### **8.1 Amazon Internal Tools    **

**8.1.1 Metadata**:  Metadata is wiki which provides information about the attribute name i.e. defines or explains what does the attribute mean and its usage, also provides sample values and indicates the attribute type (Type). Tool: https://w.amazon.com/bin/view/Metadata 

https://w.amazon.com/bin/view/Metadata/hair_type

Using attribute name as keywords in the search bar, we can find the attribute name definition.

Easy attribute search value: hair_type; form_factor; item_shape; liquid_volume

> [!NOTE] Image 5 — OCR extracted text (confidence: 75%)
> hair type
> Primary Coetact Migralos {user} How co f change this value?
> Last modi®ed 4 yoars 890 by crandra
> Search Link
> attribute name
> A fubuie:   [hair_  type]
> - Description (US) Mair Type,
> : for the product.
> 5     product_attribute_constraints (max_occurs)
> Tior product type’ PRODUCT)
> Click here to Search Metadata
> attribute definition
> Hem lon
> [hair_typa)
> New IMSv3 format
>  attribute_type
> .  nguage Localized: true
> = Product Attribute id: 6742
> CRUE
> Elomoen Name:  oir.  type
> Legal Value Type: string
> Context Name: subfield
> Legal Modifier Type: empty
> Modifier Elomont Code: 0
> Element Code: 914

**8.1.2 CAT (Catalog Admin. Tool)**: 

           CAT provides information about the product type i.e. defines or explains what does the product type mean.

https://catalog-admin.corp.amazon.com/productTypes?namespace=contribution&target=tipVersion 

 

> [!NOTE] Image 6 — OCR extracted text (confidence: 81%)
>  amazon (Catalog Admin Central                       METADATA Vv     CHANGE MAN
> Search                   Name
> UPLOAD FILE    FETCH METADATA [ll ADD RECORD [Enel Diath
> Attributes
> Product Types
> Enumerations

search by name: Product type name (CELLULAR_PHONE), product type details will give the definition

sample search value: CABINET, TABLE, DRESS, PET_FOOD

 

> [!NOTE] Image 7 — OCR extracted text (confidence: 91%)
> Q Search by Name
> search PT name
> cellular_phone             PRODUCT > CONSUMER_ELECTRONICS > PHONE
> PRODUCT                                                                             |               > CELLULAR_PHONE|
> CONSUMER_ELECTRONICS                                          ~
> PHONE                                                            ~                 Product Type Details
> select the correct PT               |
> CELLULAR_PHONE        definition required                     [             RTIP Name
> cellular_phone                           Definition of the PT
> PHONE_ACCESSORY                                     ~
> |                  Definition|
> CELLULAR PHONE_CASE                                                A cellular phone is a portable telephone that uses wireless cellular
> technology to send and receive phone signals. Features and
> functionality of cellular phones range from basic phone calls and
> text messaging, to smartphones that have highly advanced
> features including high-resolution touch screen display, high-
> resolution cameras, Wi-Fi connectivity, Web browsing, and can run
> software applications.
> Default Display on Website (Global/10480)
> ce_display_on_website
> Default GL (Global/10480)
> gl_electronics

**Filter for Attribute Types in CAT UI:**

Enter the attribute name in Attribute field path and change the number to 10480 and click on submit.

> [!NOTE] Image 8 — OCR extracted text (confidence: 75%)
> « > C    23 catalog-admin.corp.amazon.com/productTypes/CELLULAR_PHONE?namespace=contribution&target=tipVersion                              Yo     e I} |  @   :|
> @ CSITOOL @ METADATA 4% EnDtool #&# Catalog Admin Cent.. & phone tool SAP Concur Home ~~ @° Allsec Technologies @ Variations Tool @ Image Assist             » | [3 All Bookmarks|
> Is Tenet Compliant?
> Yes
> BE ts  10170
> L
> Effective Scope: | contributor vv                        JS Vv  | |  listing wv    SUBMIT|
> Attributes                         fm
> 1 results shown of 213 total resull "5071
> Atiy. 26202               tT                             Ent
> Attribute Field Path          Displ                      Ront-lags                                 ntores
> | conditional ] ¥                      +|
> Vv | 26263|
> wireless_provider         |        26264                                                      |    ||
> 26265           ict_detail               Y
> )                     ant_attributes            ¥
> Wire                   2commended_cx_relevant    Y
> wireless_provider.value         Servi 300000072                                          Y
> Provi                  se_refinements           Y
> « lons_processing               Y
> Y
> I
> customer_returns

Under the required attribute if Closed Enum is “Y” then it is hard enumerated attribute otherwise soft enumerated.

> [!NOTE] Image 9 — OCR extracted text (confidence: 73%)
> « > C 25 catalog-admin.corp.amazon.com/productTypes/CELLULAR_PHONE?namespace=contribution&target=tipVersion         x e I} (i54) :
> ® CSITOOL @ META DATA  4 EnD tool Catalog Admin Cent... &, phone tool SAP Concur Home  @° Allsec Technologies  @ Variations Tool  @ Image Assist               »     [3 All Bookmarks
> Effective Scope: | contributor || 10480 vv      en_US wv      listing vv       SUBMIT|
> Rows per page: 507       1-1 of 1       
> Constraints                                                                                       Glosed
> wo                               Enumeration Value Display J                     Enum?
> [ type | value | conditional ]                                                                        In|
> max_occurs        [+ Iv |        181, 3, AIRTEL, ALDI TALK, ALGAR,          -|
> min_occurs        E    IN            AMERICA MOVIL, A...
> Rows per page: 507       1-1 of 1       
> 4                                                             I

**8.1.3  Enumeration Discovery Tool (EnD)**: Provides the valid values (Phrase groups) for a particular PT and attribute.

https://enumeration-discovery.corp.amazon.com/ 

Select Language: Marketplace/country

- 
select product type: Product type name
- select attribute: attribute_name
- Click on the tool icon (spanner) to open the link which will show the list of values for that PT attribute.

Example: PT: DRESS, attribute: item_length_description

> [!NOTE] Image 10 — OCR extracted text (confidence: 64%)
> amazon Catalog Admin - Enumeration Discovery                                                                           Qexprtore  Oconsistencymetrics  Wouoe  [reLeasenotes © questions © @
>    oe) se
> Seacch      Insights      Reporting
> YYYY-MM-DD      Select State            -      Sedoct Language       -      DRESS                                       itom_length_deoscription value
> Sp.
> attributes
> Category Metrics as of 2022-04-04. Baseline for delta: 2022-03-05
> Showing rows 1 to 26 of 26                                                                                                                                                                                [+]
> Unreviewed                 Item                           Glance View
> State          Local... Product Type --       Attribute - -             Attribute Is Nume...
> GV... Delt... Nor... Fille... Tota... Nor... Deit.. Fille... Tota...
> /F QI or AE DRESS                fevn_length_descri... false                     56.60.       - 3152 6344 465k 4340        - 6383 1275
> Ped    en_AU DRESS                    tem _length_descn false                           6.05          - 8185 8032 559k 8302           - 7935 977k
> Pd   es MX DRESS              fem _length_descn. false                   14.14        - 5687 8043 1827k 60.85       - 8332 661.0k
> / QIZ=D BE DRESS                 fem_length_descn.., | false                           -         -         -         -        [4]         -         -         -         [1]|
> FS QED ©.CA DRESS                    dem_jength_descn.. false                          99.96           - 010 6806 4522k 004           - 7789 3M
> pd    nl_NL DRESS                    dem _length_descn._. false                           248          - D606 7887 442k 9699          . 8274 888K
> F    pIBR DRESS                    dom _jongth_doscn... false                          444          - B924 6347 204k 8000          - 7238 613
> F    de_DE DRESS                     ftem_length_descn.., false                            0.56           - 9562 B873 B078k 9672           - 9358 56M

This is the link after clicking on the spanner: 

https://enumeration-discovery.corp.amazon.com/project?languageTag=en_US&projectId=5b2f331d-b5d9-4691-8774-ec3c3e9e355f

Note: State/status – Published/Approved can be considered. Meaning the EnD team has researched, evaluated, normalized and uploaded the values on the UMP (unified metadata platform) for the PT attribute.

In Progress – meaning the EnD team has work in progress or yet to research, evaluate, normalize and upload values for the PT attribute.

** The values on EnD is used as a reference to know about values and normalization. New values can be added to the existing list of values.

> [!NOTE] Image 11 — OCR extracted text (confidence: 61%)
> amazon Catalog Admin - Enumeration Discovery                                                                                                                         Qexpiore  OconsisTEncY metrics Blcuwoe  [EIRELEASENOTES ©
> Enumeration Constraint         Range Constraint
> EEE EE
> DRESS / item_length_description.value ( STRING ) / *-Y8 ~
> This project has been published and is currently considered closed. Creating or deleting a valid value will result in the project being re-opened for all locales, edits to valid values will re-open only this locale.
>     Above the Knee              xo | A Caution!|
> :                         Value with Canonical Rep High-Low” ard Concept (Enum Value) Tioh_iow”.
> Concept (Enum Valoo) svove_me_srdiSt of NORE ANT ZEAE Vote win Cononcat Rep xm sng 0d Coniston Value) Knee_jength”
> values
> SM Update:                        -                                                                                                              Normatizea Valid value coverage on EnD                           Filled
> hitps fizsues amazon comissuesNLS-
> RO-UNCLASSIFIED-109              7
> https www Zalora. com phiwro-moda-plus list of synonyms under                                                                                         w= Normalized Vales we Nirmalzable Valet = ovals Vales w= ignored Valet oo Usrevawed Vales @ Undied Vales
> ET values  Er Cr Ce Er EE                  ASIN coverage
> E)
> 2                                                    search for values which                $n Enum Discovery. ==) : Jo Métadetn =~                                    daa                     Wome --                         "ov                        ov -
> 5                                         are not in the list
> =                                               (beside)                                       Vata                         Vala                                              334.5%                           99                        192M                          162
> 5                                                                                                                                          Invasg                                :                                                                       342.0                                    101                                  um                                    124
> shows if the value is |                             Vaid                                                      262k                               77                            142m                              120|
> valid(mainvalue), synofi{fin, Invalid,         he cod                                              26.9%                           67                        133M                          n2
> unreviewed                  Ivasd                       :                                                  559.0                          165                        13M                          n2
> vaia                                   Vala                                                                 167.6                                     49                                   75M                                     63
> Vaid                         Vala                                              430.5                          130                         69M                           58

[[Starfish Modular Title Quality Audits]]
