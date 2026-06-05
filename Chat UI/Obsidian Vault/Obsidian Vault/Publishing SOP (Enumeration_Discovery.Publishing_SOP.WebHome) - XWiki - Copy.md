# Publishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki

> [!INFO] Conversion Metadata
> **Source file:** `Publishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki.pdf`
> **Converted on:** 2026-05-13 at 10:38

---

Amazon Confidential
Publishing SOP
Primary Contact kardivya (user) How do I change this value?
Last modified 1 month ago by cchopral.
Why Publishing ?
The Publishing process is the final stage which transforms valid values from the EnD tool into the Unified
Metadata Platform (UMP), enabling their use in cataloging, seller templates, and refinement attributes.
What is Normalization?
In data systems, normalization means taking different inputs that mean the same thing and standardizing
them to one canonical (official) value.
Why deleting the picker value?
If any picker value is added as synonym, always delete that synonym before publishing the enumera-
tion on the tool.
This process should also be run for any values being added as synonyms for an enum. EnD maintains syn-
onyms for enum values and normalizes these values to the canonical enum value on the ASIN (EXAMPLE). If
a synonym represents an existing picker value but is added as a synonym for an enum value then this has the
potential to impact assignments to that picker. For instance, to take the previous example, the Wireless enum
has a synonym of IR. If there is a pre-existing picker that queries on IR specifically it could experience an
ASIN drop at the point that the IR value is normalized on ASINs. Therefore, if mapping a synonym to an
enum, please ensure that you have first run the impact analysis below on the synonym.
If the system normalizes (standardizes) the term "IR" to "Wireless", the picker might no longer find the
ASINs it used to, because it’s now looking for a value that no longer exists under that name.
After normalization:
The system replaces connectionType = IR with connectionType = Wireless
Picker still queries: connectionType = IR → ❌ ASIN A123 is no longer returned
Because no ASIN has IR anymore — they now have Wireless.
What is an ASIN Drop?
This term means: the number of ASINs returned by a query drops — some ASINs that used to match the
search now don’t.
In this case:
Before normalization: 100 ASINs matched IR
After normalization: 0 ASINs match IR, unless the picker is updated : ➡ ASIN drop = 100
Flow Chart
This process is the same also for ILT and New Enums .
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/1/12

Quip for Q&A:
You can ask every question related to Publishing task at this link: https://quip-
amazon.com/5q0ZANedbjFn/Publishing-QA#temp:C:LPd86fed43aabcb4eda9d53ce864
Step 1
If the precheck for the SPECIAL ATTRIBUTE fails then
Double check the special attribute list
After a PTA is assigned on AMS tool, the first step is to open the special attribute list:
https://w.amazon.com/bin/view/Enumeration_Discovery/Special_Attributes_List
If the PTA is not in the list, proceed with Step 2.
If the PTA is in the special attribute list:
If is part of the Troubled attribute list, it should not be published, but it should be marked as "Non eligi-
ble" in AMS.
If it is a part of Restricted attribute, it should not be published, but there are some exceptions:
1. Non Enumerable_Infinite_VV_Set
2. Non_Enumerable_Multi-concept-values
3. Non_Enumerable_Descriptive_Nature
In these cases, the PT/A can be published if all the values are in UMP.
For ITEM_FORM attribute, check the consumables list:
https://share.amazon.com/sites/EnD2021/_layouts/15/WopiFrame2.aspx?sourcedoc=%7b398C0685-

## 57F6-402B-90CA-

6BB1D68FBD96%7d&file=Item%20Form%20Consumable%20PT%27s.xlsx&action=default
If the PT is present, the item can be published without making any changes to the values. However, if any
valid value has been edited, it must be reverted to the original UMP value before publishing.

5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/2/12

Step 2
Check for worked Locales and for Values deleted/to be deleted in EnD UI
The second step is to check the Valid Value panel on the left side of the UI in EnD tool in order to see
if there are some values in “Deleted” status or in “Approved” but in red:
In this case, we have to request the deletion of those values in red, otherwise, we cannot proceed with
Publishing. In order to request the deletion, a PM SIM should be raised.
This does not apply for deleted values that were replaced by the correct representation. For example:
PVC is “IN UMP” status, the value is deleted and a new value Polyvinyl Chloride (PVC) as added as correct
representation. Same rules is applied when a suffix is added: for example, Mid is deleted and Mid Rise is
added for attribute called rise_style. In these cases, PM SIM is not needed.
PM SIM can be done by cloning this SIM: https://issues.amazon.com/issues/D74368463 and then add this in-
formation: Product type Attribute Product line Refinement details for the value VGA : check in project SIM if re-
finements for that particular value exists or not, and if yes, mention the marketplaces for witch refinements are
existing (after the approval, Refinement SIM should be created for updating the picker).
Check for worked Locales and for Values deleted/to be deleted in EnD UI
Go to en_US in EnD and click on “Publish” button, right after the “Sync” one. It will open a menu, where you
can click on "Select All Approved Locales" to have the list of the marketplaces where the PTA has been ap-
proved. If you don't find one or more of the locales you have to publish, you can click on "Select All Published
Locales" to see if the PTA has already been published. You can also click on "Deselect All" in order to start
again or to search manually for the locales:
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/3/12

If one or more locales are not in the mentioned lists, it means that they are not approved. Please, open the lo-
cale and check if the PTA was worked or not. If yes, move it to Approved and then publish it with the others ; if
not, put "Pending localization" and write the locales that were not worked in the AMS comments column.

Step 3
Pre-Checks and Refinements
https://quip-amazon.com/Q60NAOkRLvIn/Picker-EnD-value-Auto-Sorter
From  Precheck Dashboard, select the PT/A and the locales, and download the Attribute Picker Values,
choosing the "Export to CSV" option.
Then download the “Translations” file from the EnD tool as shown below

5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/4/12

3.1 Follow this quip to sort the difference in the picker in one single file and to decide if
the SIM needs to be raised.
Picker-EnD value Auto Sorter
In the file check the values that are not highlighted in yellow as these will be the values which will be
different in picker values and/or EnD valid values.
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/5/12

Now if the picker value can be synonym of the end value or visa versa then we raise a refinement, for
example in this below case.
Value “Rattan” is different for both in picker value in column G and EnD Value value in column H, In this
case we will ask the language expert SIM and then if needed a refinement SIM as well.
In column C the translated value of picker value is mentioned and in column I the US value of EnD tool
is mentioned.
in H coloumn.
If picker_irn and en_US are same they will be marked as yellow.
If picker value and EnD value are same they will be marked as yellow.
If End value included in the aqp column, they will be marked as green, in this case we need not raise
this value as its already updated.
Format for raising SIM will be written in column J. The format will be
“Market Place | ref_node_id | picker_value | EnD_value | en_US | picker_node_id | Display Label
Edits” as shown in the above image for JP locale.

3.2 Enumeration and Discovery Tenets
1. Relevance: Valid values don't exist in isolation. They must be applicable to the attribute’s defined pur-
pose and scope within the context of the relevant Product Type(s). for e.g. values such as red, green,
blue is not relevant for the attribute finish_type. Enumeration values must also be valid for the PT and
the attribute that is being enumerated.
2. Uniqueness: Valid value sets must not contain values that are a) synonyms b) alternate word
forms/phrases representing the same concept. e.g. values such as XL and Extra Large are synonym
values for size attribute and birch wood and birch are alternate word forms.
3. Global: Valid values must be global and not have regional variation unless standardize regional vari-
ances exists. Display labels for each language will represent the regional variation of the value, if any.
Example: The valid value could be sweater but a display label for en_GB could be “jumper.” Any excep-
tion will follow the approved exception process.
4. Specificity: A valid value must serve one intent rather than compounding multiple concepts in a single
value. The value should be unambiguous. For example, foldable is not a good value for form_factor for
CHAIR since it can refer to a very specific type of chair (folding chair) or other forms foldable chairs
such as beach chairs. Cleanroom is an unclear and ambiguous value for special features for janitorial
supplies when what is meant is cleanroom grade.
5. Consistent Granularity: Valid values in a set must be at the same level of granularity. For example,
Android Oreo and iOS are at different level of granularity; one at the specific version level and the other
at OS family level.
6. Marketing Agnostic: Valid values must contain generally applicable terms as opposed to branded or
trademarked values unless the data is collected in an attribute with the intent of supporting specific
branding. e.g. Acoustic Noise Cancelling (Bose branded value) vs Active Noise Cancelling (Brand ag-
nostic value).
7. Consistent Representation: Valid values must follow proper and consistent spelling guidelines.
Values should aim for consistency across UMP enumerations e.g. “heart-rate”, “heart rate” or
“heartrate” same value across UMP, not mix. Please refer to enumeration naming guidelines. The
guidelines would ensure the consistency.
8. Structurable: The attribute must be considered structurable before it can be enumerated. Non-struc-
turable attributes are generally identifiers and descriptive attributes meant for customer friendly descrip-
tions of the product, statements on a product label and instructions. For example [ingredients] is meant
to reflect the ingredient statement on a product label and should not be enumerated.
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/6/12

9. Semantically Consistent: The valid value set must not conflate values for different attributes into one,
e.g. AC and Female plug are conflating multiple concepts for attribute power_source_type. Values like
Shoulder, Cross body, Padded Strap, Waist Strap, Removable, Adjustable, Single, Double cannot all be
retained as valid values for strap_type as they represent multiple concepts.
10. Enumerable: The attribute must have a meaningful scope to allow for consistent enumeration and
have a manageable and customer friendly universe of values. For example, active_ingredients is not
enumerable since it is descriptive in nature and can have endless number of values, encompassing
bulk ingredients and active pharmaceutical ingredients
Validate the VVs against the tenets for whichever value a re-
fimement SIM will be raised.
STEPS To raise a language expert SIM
https://sim.amazon.com/issues/create?templateIssue=ff526c2c-971a-47f2-a005-8ea9b80b7ebf
Title has to be the PT and the Attribute. Then, replace the values in the various lines without touching
the header. MP is the marketplace, and you can find it in Refinement file, at column B ; Picker IRN can
be found in Refinement File, at column Q ; Ref node ID can be found in Refinement file, at column I ;
Picker & AQ Value (BEFORE) is the value in the refinement file, in column X ; Proposed AQ Value
(After) is the value in EnD ; Local picker node can be found in Refinement file, at column V (sometimes,
is the same number of Ref node ID), and Type of request is “Display Label Edits” in case of translation
change, “Delete request” in case of deletion of the value. Don’t forget to use “ | “ between one value
and another. Put the PTA both in the title of the sim and in the Custom Fields.
Also, add the Enumeration link for the particular PT/A
After you click on “Create an issue in Refinement Picker Value Updates” field, tag POCs for the im-
pacted marketplaces, choosing the option “Pending linguist review”
BLR (DE, FR, IN): tanejdik@amazon.com; ganshayn@amazon.com
BTS (ES, IT, PL. BR, TR): borsovae@amazon.com ; bogaza@amazon.com
LHR (NL, SE): slagmany@amazon.co.uk ; agunnars@amazon.co.uk
CTS (JP): ushentai@amazon.co.jp
If the language expert approves the EnD value, ticket can be raised with Taxonomy.
If the language expert approves the refinement picker value and says that it is correct, please revert it
and change the value on EnD tool and proceed for publishing the PTA.
If the language expert says that both are incorrect and gives a new value, raise a ticket to PK with that
particular value that is provided by language expert. Also add the correct value mentioned by the lan-
guage expert to the EnD tool.
In all three cases, the activity has to be paused on AMS until the ticket is closed. SLA for language ex-
perts is 24 hours, in case of delay, escalate to site POC in the SIM itself in order to expedite. Once lan-
guage tickets will be solved, the activity can be closed on AMS, or with Published with Refinements de-
cision or with Refinement SIM raised.
Do check that no picker values are added as synonym in any of the market places where the refine-
ments exist before raising the SIM.
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/7/12

STEPS To raise a Refinement SIM
https://csi.amazon.com/diag/PK_Unified_Intake?resourcePath=PK_Unified_Intake&diag_run_id=648ecc6f-
3934-45ba-93a6-eda7a8805016

## PK UNIFIED INTAKE

What is the customer problem you're trying to solve?
___ refinement pickers need to update
Which regions are impacted?
Will the changes impact all regions and marketplaces?
No
Which marketplaces are impacted?
Indicate which regions are impacted by the request.
EU (European continent and UK)
United Kingdom (UK)
Italy (IT)
Germany (DE)
France (FR)
Spain (ES)
Turkey (TR)
Netherlands (NL)
Sweden (SE)
Poland (PL)
Belgium (BE)
Ireland (IE)
AM (North and South America)
United States (US)
Canada (CA)
Mexico (MX)
Brazil (BR)
IMEA (India, Middle East, and Africa)
India (IN)
United Arab Emirates (UAE)
Saudi Arabia (SA)
Egypt (EG)
South Africa (ZA)
APAC (East Asia, South Asia, Southeast Asia, and Oceania)
Japan (JP)
China (CN)
Australia (AU)
Singapore (SG)

## XLBE

Thailand (TH)
Indonesia (ID)
Is the request for changes to PK content or PK software and systems?
Content
What type of content changes are needed?
Create or update refinement
Create or update refinement
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/8/12

Hardlines Product Line Impacted
Softlines Product Line Impacted
Consumables Product Line Impacted
What is the product type impacted?
What are the existent attributes impacted?
Please provide the list of attributes separated by comma (,) and each attribute enclosed within ([ ]) braces
(Provide the Product and the attribute)
New/Existent Refinement
Existent
Existing refinement Inputs
What is the customer problem?
Assignment Query update
Is the refinement related to an ARA-refinement or a Legacy refinement?
Legacy
Require any ASCS PE (L7) Support
No
Ticket to Taxonomy should be raised by copy-pasting everything from the ticket approved/suggested by lan-
guage experts in a new SIM at this link:
https://issues.amazon.com/issues/create?assignedFolder=2786fdc3-33fc-4f5e-beba-1c54d3227354
- Change the severity to 3
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/9/12

Add the SME (Dev Krishna Devan) as the watcher of the SIM, also attach the excel file
Provide the SIM link to the AMS, and add decision as "Refinement SIM raised" and the PTA and SIM
link with the date to be added in this Resolved Publishing PTA’s Quip to keep a track of the PT/A’s to
be published.
Taxonomy should reply in 48 hours. If not, it’s highly recommended to send a follow up in the SIM.

Step 4: Publishing
After all the checks are done, the PTA can be published. Go to en_US in EnD and click on
“Publish” button, right after the “Sync” one. It will open a menu, where you can click on "Select
All Approved Locales" to have the list of the marketplaces where the PTA has been approved.
Once the changes are implemented and the SIM is resolved, and finally after checking the re-
solved PT/A’s Quip publish the PT/A on EnD tool.
5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/10/12

If the locales written in AMS can all be published, click on "Publish" button and wait until you see
that the PTA has been published with success in all requested locales. In this case, submit your
PTA in AMS clicking on "Published" if the PTA does not have refinements, and "Publish with
Refinements" if it has refinements but no SIM is raised.
In some cases, Publishing can fail, and a failure notification e-mail will be sent with the failure
reason. In this case, please contact your SME to raise a ticket on this link
https://t.corp.amazon.com/create/templates/53c5bd04-acca-4001-b3ea-08d2b46f38b9
SME list:
BLR - Ranju Raju - ranjurm@amazon.com ; Arjumand Banu - arjumand@amazon.com
LHR - Yoshiko Slagman - slagmany@amazon.co.uk
CTS - Sheng Tsao Tai - ushentai@amazon.co.jp
BTS - Emese Borsova - borsovae@amazon.com
Some Important Points:
 How to find the PRODUCT LINE ?
Open the Consistency Checker with the help of this link:
Consistency Checker - All Attributes go to Product Type sheet.
Filter column A by the requested PT, check column D of Product Type sheet and copy the content ; then, go to
product line site: w.amazon.com/bin/view/Product Line and search for the word found in column D.

## EXCEPTIONS:

For the attribute “age_range_description” there is a list of PT that cannot be published in all locales: SHIRT,
DRESS, PANTS, COAT, SWEATER, UNDERPANTS, SWIMWEAR, KURTA, PAJAMAS, ROBE, SOCKS, HAT,

## BRA, SALWAR_SUIT_SET, SHORTS, SUIT, SKIRT, BLAZER, SWEATSHIRT, TUNIC,

## TRACK_SUIT,UNDERGARMENT_SLIP, CORSET, VEST, TIGHTS AND OVERALLS, WATCH, SHOES,

## LUGGAGE, FOOTWEAR

The attribute “item_form” is part of consumables project: only Synonym Mapping is performed, so do not pub-
lish any edited Valid Values. If it’s edited, revert it back to UMP value and only then publish.

## BLOCK DAYS:

There are some days when it is not possible to publish. In order to know there in advance, without waiting for
the e-mail, there is a page with the calendar:
https://w.amazon.com/bin/view/ChangeControlPolicy/Calendar/2024/
Days with communication in red are the days when publishing is forbidden. Publisher can put himself as a
watcher, clicking on “Tools” on the right side and then on “Watch Page”, so notifications will be active.

## SENSITIVE ATTRIBUTES :

If the attribute is designated as sensitive on any of the above lists and the appropriate action to take is unclear
then please open a project with the relevant taxonomy team. The instructions for opening a project request
can be found here. Please ensure that any projects are opened with the appropriate team (e.g. if it’s a
Softlines PT like APPAREL then select Softlines from the Productline dropdown). Do not just the Productline
to All as this will result in delays in your SIM being handled.
1. Submit the refinements that were identified in the previous step for correction. If any refinements were
identified for correction then verify first if they appear on any of the sensitive attribute lists.
1. Sensitive Softlines Attributes
2. Sensitive Hardlines Attributes
3. Sensitive Consumables Refinements / Attributes

## ILT UNSTRUCTURABLE:

5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/11/12

Tags:
- Only publish the PT/A when the status of the PTA is Unstructurable, DO NOT publish it if it is Marked as
Brand-Based Values or structurable. If in case the status is anything apart from Unstructurable, it needs to be
changes by the SME currently Dev Krishna Devan
- Do not check the prechecks for the unstructurable enumerations, it can be directly published on EnD Tool.

## IF PARENT PT FAILS:

Check the prechecks for the PT, if parent PT fails;
STEP 1 : check the prechecks for the child PT
STEP 2: Relevancy fails - work on the parent PT
Relevancy passes - check the Tenant compliant in CAT tool for the Child PT.
STEP3: Tenant Compliant passes or says Yes - check if he VV’s of child and parent PT matches for the same
attribute and if VV’s do not match, mark it as Non Eligible in AMS. If VV’s matches - work on the parent PT.
Tenant Compliant Fails or says No then you can directly work on the PT.
Don’t
- Don’t click on Publish button if there are Valid Values in red, unless they are values already replaced by the
correct representation. Follow the steps described in Step 1.
- Don’t Publish if there is a conflict between Refinements and actual Valid Values. Follow the steps described
in Step 2.
- Only publish once the refinements added as synonyms are deleted.
AMS and AHT
The AHT will depend on the final decision on AMS:
Published / PM SIM raised - 6 minutes
Published with Refinements / Refinement SIM raised - 32 minutes
Needs localization - 3 minutes
Tech issue and Not eligible doesn't have AHT and will not be counted.

VersionDateUpdate
By
Approved
By
Comments/Changes
V16/9/2023bogaza@tshivanCreated the SOP review
V28/17/2025cchopral@samtanisLanguage expert SIM format updated as per current
changes. ZA MP example updated. Auto-publishing tool
details for no-refinement PTAs added.
V34/10/2026cchopral@arjumandThe Enumeration Tenets were updated

5/13/26, 10:36 AMPublishing SOP (Enumeration_Discovery.Publishing_SOP.WebHome) - XWiki
https://w.amazon.com/bin/view/Enumeration_Discovery/Publishing_SOP/12/12

[[Catalog System Map _ System Details]]
