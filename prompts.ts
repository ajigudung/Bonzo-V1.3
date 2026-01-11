const promptCategories = {


// MENU RESTORASI

  restoration: {
    title: 'Restoration',
    icon: '🛠️',
    items: [
  
      {
        label: 'Forensic Photo ',
        prompt: `
{ "Task":"extreme_archival_restoration_with_face_protection",
  "Input_image":"scanned_photo_2400dpi",
  "Profile":"museum_archival_forensic_face_safe",
  "Scan":{"dpi":2400,"media":"aged_bw_print","process":"mechanical_halftone","pattern":"hexagonal_honeycomb","generation_loss":"very_high"},
  "Constraints":{"preserve_identity":true,"face_lock":true,"no_reconstruction":true,"no_synthesis":true,"no_imagination":true,"no_colorization":true,"no_historical_change":true},
  "Regions":{"face":{"detect":"semantic_multi_face","protect":"maximum","freq_suppress":"selective","micro_detail_loss":false,"edge_priority":"bone_structure","expression_lock":true},"non_face":{"strength":"extreme","allow_texture_loss":true,"aggressive_descreen":true}},
  "Objectives":{"p1":["halftone_removal","moire_elimination","paper_texture_removal"],"p2":["chemical_damage_fix","scratch_emulsion_repair"],"p3":["continuous_tone_rebuild"]},
  "Pipeline":[
    {"step":"spectral_descreen","method":"adaptive_multi_notch","strength":"extreme","face_resistance":"very_high"},
    {"step":"face_stabilization","method":"limited_low_pass","iterations":"minimal","prevent_blur":true},
    {"step":"non_face_cleanup","method":"edge_aware_diffusion","iterations":"very_high","destroy_patterns":true},
    {"step":"locked_inpainting","method":"structure_preserving_fill","targets":["screen","spots","abrasion","voids"],"exclude_face":true},
    {"step":"tonal_rebuild","method":"silver_gelatin_reprojection","dynamic_range":"expanded","highlight_protect":true,"face_contrast":"neutral"},
    {"step":"edge_reassert","method":"low_freq_edge","strength":"very_low","apply_to_face":false}],
  "output":{"downscale":{"method":"intelligent_resample","target_dpi":800,"preserve_face_detail":true},"surface":"smooth_continuous_tone","face_surface":"natural_historical","grain":{"face":"retain_minimal","non_face":"remove_all"},"format":"16bit_tIFF"},
  "negative":["face_reconstruction","beauty_retouch","skin_smoothing","ai_detail","plastic_skin","false_sharpness","modern_look","moire_replace"],
  "tradeoffs":{"detail_loss_non_face":"very_high","detail_loss_face":"minimal","identity_accuracy":"maximal","cleanliness":"very_high"}} 
`
      },
      {
        label: 'Damage Photo',
        prompt: `
{ "Task": "Forensic archival restoration of an aged halftone photograph into clean modern black-and-white continuous-tone image",
  "Objective": "Remove chemical yellowing, halftone honeycomb patterns, physical damages, and blur while preserving original identity and producing a high-contrast modern black-and-white look with smooth tonal gradation",
  "constraints":{"preserve_identity":true,"face_lock":true,"no_reconstruction":true,"no_synthesis":true,"no_imagination":true,"no_colorization":true,"no_historical_change":true},
  "Workflow": [
    {"step": "chemical_yellowing_removal", "method": "paper_base_neutralization", "target": "aged_paper_background", "preserve_original_density": true},
    {"step": "halftone_honeycomb_elimination", "method": "adaptive_frequency_separation", "strength": "very_high", "reconstruct_continuous_tone": true, "avoid_pattern_replacement": true},
    {"step": "damage_repair", "method": "structure_preserving_restoration", "targets": ["scratches", "tears", "dust", "stains", "missing_emulsion"], "allow_texture_recovery": true },
    {"step": "detail_recovery", "method": "edge_aware_deblur", "strength": "moderate", "preserve_natural_edges": true, "avoid_ai_detail_generation": true},
    {"step": "black_and_white_conversion", "method": "spectral_luminance_mapping", "tone_reference": "modern_monochrome_camera", "preserve_midtones": true},
    {"step": "contrast_enhancement", "method": "cinematic_bw_curve", "contrast_level": "high", "black_point": "deep", "white_point": "clean", "avoid_crushed_shadows": true},
    {"step": "final_smoothing", "method": "continuous_tone_refinement", "remove_print_texture": true, "grain_control": "natural_minimal"}],
  "Output": {"color_mode": "true_black_and_white", "look": "modern_monochrome_photography", "tonal_style": "smooth_continuous_gradient", "sharpness": "natural_high_clarity", "grain": "film_like_subtle", "bit_depth": "16bit", "format": "TIFF"}  "quality_target": "natural_photographic_realism",
  "intended_use": [ "photo_exhibition_premium", "large_format_print"],
  "resolution": "4K", "dpi": 300, "format": "PNG", "color": { "white_balance": {"temperature_range": "5200K-5600K", "profile": "daylight_neutral"},"vibrance": 18, "saturation": "4-8", "color_space": "sRGB IEC61966-2.1"},
  "lighting": {"style": "natural_well_lit", "avoid": ["dramatic_lighting", "cinematic_contrast", "stylized_light_sources"]},
  "print_readiness": {"sharpness": "exhibition_safe", "noise_level": "minimal_natural", "banding": "none", "artifact_free": true}, "delivery_ready_for": ["digital_display","professional_print"]}
  "Negative Prompt": ["colorization", "sepia_tone", "paper_texture", "halftone_pattern", "honeycomb_texture", "pixel_grid", "plastic_skin", "ai_generated_detail", "beauty_retouch", "over_sharpening", "halo_edges", "false_micro_detail", "modern_fashion_styling"],
`
      },
      {
        label: 'Global Correction',
        prompt: `
{"input_image":"monochrome_vintage_photo",
"task":"image_restoration_and_colorization",
"output_format":"high_resolution_digital_image",

"colorization":{
    "color_model":"realistic_modern_digital_camera",
    "palette":"realistic_natural",
    "global_correction":["auto_white_balance_daylight","dynamic_range_expansion_highlights_shadows","optimized_natural_saturation","contrast_enhancement"],
  "specific_mapping":{
    "vegetation":{"hue":"natural_forest_green","saturation":"realistic_photosynthetic_green","luminance":"bright_sunny_day","texture":["leaf_veins_clarity","dew_reflection"]},
    "human_skin":{"hue":"diverse_natural_skin_tones","saturation":"subtle_radiant","luminance":"well_lit_conditions","texture":["epidermal_subtlety","capillary_detail"],"ethnic_accuracy":"implied_ethnicity_preserved"},
    "architecture":{"palette":"vivid_historical_paint","saturation":"realistic_historical","luminance":"uniform_bright","texture":["masonry_grout","window_reflection","ornament_sharpness"],"condition":"newly_painted_only"},
    "construction_materials":{"iron_steel":{"hue":"deep_black_or_dark_charcoal","luminance":"subtle_metallic_sheen","texture":"clear_metal_grain"}, concrete_cement":{"hue":"cool_grey","saturation":"low_subdued","texture":"raw_porosity_gritty","condition":"allow_dirt_grime_for_realism"}},
    "paved_roads":{"hue":["charcoal_to_black_asphalt","light_grey_concrete"],"saturation":"low_to_medium","luminance":"low_to_medium","texture":"granular_or_smooth_porous","condition":"flat_smooth_surfaces"},
    "gravel_earth_roads":{"hue":"brown_to_light_grey_ochre","saturation":"medium","luminance":"medium_high","texture":"coarse_gravel_ruts","condition":"worn_unpaved"},
    "soil_construction":{"hue":"dark_reddish_brown","saturation":"deep_rich","luminance":"low_medium","texture":"coarse_lumpy","condition":"excavated_or_disturbed"},
    "soil_natural_dry":{"hue":"light_brown_ochre","saturation":"low_medium","luminance":"medium_high","texture":"fine_granular","condition":"undisturbed_natural"}}},

"restoration":{"damage_repair":"contextual_inpainting_adjacent_pixel_priority_no_new_objects",
  "blur_reduction":"gentle_deconvolution_with_noise_control",
  "noise_reduction":{"textured_areas":"balanced_preserve","uniform_areas":"aggressive_smooth"},
  "detail_enhancement":{"upscale":"super_resolution_4k_equivalent","sharpening":"mild_edge_enhancement","texture_reconstruction":"restore_existing_micro_texture_only","generation_constraint":"no_new_structures"},
  "scope":"full_image_foreground_midground_background",
  "monochrome_protocol":{"remove_all_monochrome":true,"force_full_colorization":true,"allow_neutral_tones_for_realism":true}},

"quality_metrics":{"overall":"eliminate_vintage_degradation_prioritize_fidelity",
  "final_appearance":"pristine_modern_4k_native_look_with_natural_micro_texture",
  "color_accuracy":"real_world_indistinguishable",
  "sharpness":"maximum_perceptible_across_planes",
  "aesthetic_goal":"revitalized_contemporary_clarity_zero_hallucination"}}
`
      },
      {
        label: 'Crisp Restoration',
        prompt: `
{"objective":"fast full-color cinematic enhancement with natural lighting while strictly preserving original face and pose",
  "target_result":"clean professional timeless look optimized for speed and efficiency",
  "step_1":"cleanup:{upscale:3.0,denoise:0.4,artifact_removal:true,banding_reduction:true,stain:'auto',crease:'auto',texture_guard:0.9}",
  "step_2":"retouch:{keep_identity:true,lock:['eyes','nose','lips','eyebrows','jawline','face_shape','expression'],skin:'natural_even_with_texture',hair:'clean_neat',eyes:{white_desat:0.08,iris:0.35},teeth:'subtle_natural',clothing:'refine_quality_keep_style'}",
  "step_3":"camera:{emulation:'modern_mirrorless',lens:'standard_50mm',look:'sharp_natural_fast',framing:'3/4_body',crop:'protect_face_hands',zoom:'minimal_out',lighting:'soft_even_front',color:{sat:'balanced',contrast:'medium_soft'},sharpen:{edge:0.35,radius:0.7},noise:{lum:0.18,chr:0.22}}",
  "step_4":"output:{ratio:'4:6',dpi:300,color_space:'sRGB',quality:'flash_optimized_print_ready'}"
  "negative_prompt":["plastic skin","harsh shadows","color casts","halo artifacts","background change","posterization","banding","oversaturated skin"],

}
`
      },
      {
        label: 'Vibrant Restoration',
        prompt: `
{ "task":"Restore, repair, and colorize the attached black-and-white or damaged photograph into a modern digital photo. Automatically repair scratches, tears, fading, dust, and blemishes while preserving original detail. Reconstruct missing or unclear areas naturally and sharpen facial features, fabric textures, and background elements while maintaining authenticity.",
  "colorization":{"skin_tones":"realistic natural","hair_colors":"realistic","clothing_colors":"authentic to era and context","environment":"fully colorized, cohesive, realistic"},
  "image_enhancement":{"tone":"bright vibrant daylight","atmosphere":"warm and fresh","facial_details":"fully preserved","background_lighting":"consistent"},
  "camera_emulation":{"camera":"FUJIFILM GFX 100S II","lens":"50mm f/1.8 prime","look":"ultra sharp, rich micro-contrast, natural color science"},
  "composition_rules":{"crop_policy":"do not crop face or hands","keep_pose":true},
  "subject_constraints":{"keep_identity":true,"lock_features":["eyes","nose","lips","eyebrows","jawline","face_shape"],"expression_policy":"preserve original"},
  "retouching":{"skin":{"tone":"keep original color","finish":"smooth healthy radiant","texture":"retain fine pores","avoid":"plastic look","blemishes":"lightly reduce temporary blemishes only"},"hair":{"finish":"clean neat shiny"},"eyes":{"whites_desaturation":0.9,"iris_clarity":0.5},"teeth":{"natural_whiten":0.2}},
  "clothing":{"style":"same or similar","quality_upgrade":true,"fabric_look":"premium fine weave crisp edges","color":"preserve original"},
  "lighting":{"setup":"bright soft even front light","key":"beauty dish or ring light straight-on","fill":"broad soft fill to remove harsh shadows"},
  "color_tone":{"overall":"vibrant dynamic true-to-life skin tones","saturation":"moderate","contrast":"medium with soft roll-off"},
  "detail_sharpness":{"method":"edge-aware sharpening","amount":0.55,"radius":0.8,"noise_reduction":{"luminance":0.2,"chroma":0.25}},
  "cleanup":{"remove_noise":true,"remove_artifacts":true,"background_banding_fix":true},
  "controls":{"face_identity_lock":0.99,"pose_lock":0.99,"clothes_style_lock":0.95},
  "negative_prompt":["no AI face reconstruction","no pose change","no facial expression change","no clothing change","no beautification","no makeup changes","no facial modification","no body reshaping","no stylization","no artistic filter","no painterly effect","no cinematic drama","no blur","no added background objects","no color grading shift on clothes or skin"],
  "output":{"resolution":"4K","dpi":300,"format":"PNG","temperature":"5200K-5600K","vibrance":18,"saturation":"4-8","color_space":"sRGB IEC61966-2.1"}}	
`
      },
      {
        label: 'Image Fixer',
        prompt: `
{ "model":"gemini-nano-banana-flash-latest",
  "task_type":"image_to_image_enhancement",
  "task_objective":"restore full-color natural look with improved lighting clarity and subtle cinematic depth while strictly preserving original face and pose",
  "reference_image":"{use_uploaded:true,identity_lock:true,aspect_ratio:'preserve'}",
  "output_quality":"{resolution:'4K_equivalent',detail:'high',realism:'photorealistic'}",
  "restoration_objectives":"{remove:['dust','scratches','noise','stains','aging'],face:{identity:true,texture:'natural',skin:'non_plastic',eyes:'clear'}}",
  "camera_emulation":"{body:'Canon EOS R5',lens:'50mm f1.8',look:'sharp_natural',framing:'3/4_mid_thigh',crop:'protect_face_hands',lighting:'soft_even_front',saturation:'moderate',contrast:'medium_soft'}",
  "color_restoration":"{realistic_colorization:true,accurate_skin:true,white_balance:'neutral'}",
  "lighting_adjustment":"{exposure:'balanced',highlights:'controlled',shadows:'open'}",
  "detail_sharpening":"{edge_aware:true,amount:0.35,halo:false}",
  "noise_reduction":"{luminance:0.25,chroma:0.3}",
  "processing_style":"{look:'clean_modern_natural',retouch:'light_professional',ai_artifacts:'none'}",
  "engine_settings":"{engine:'nano_flash',speed:'maximum',quality_bias:'balanced',identity_lock:true}",
  "restrictions":"['no_face_geometry_change','no_face_swap','no_background_change','no_artistic_filters','no_new_elements']",
  "output_intent":"{use_case:['digital_display','standard_print'],editorial_safe:true}"
}
`
      },
      {
        label: 'Rulie Restoration',
        prompt: `
{
  "model":"gemini-nano-banana-pro-latest",
  "task":"high_resolution_photo_restoration_and_modern_colorization",
  "input_image":"scanned_or_uploaded_vintage_photo",
  "scan_assumptions":"{dpi:2400,source:'printed_black_white_photo',print_tech:'mechanical_halftone',paper:'fiber_based'}",
  "global_constraints":"{identity_preservation:true,no_face_reconstruction:true,no_feature_invention:true,no_pose_change:true,no_style_transfer:true}",
  "restoration_objectives":"{primary:['aggressive_halftone_descreening','remove_screen_interference','dust_scratch_stain_removal'],secondary:['continuous_tone_recovery','midtone_restore','edge_structure_preservation']}",
  "detected_artifacts":"{halftone:{shape:'hexagonal',severity:'very_high',priority:'critical'},paper_damage:['aging_spots','abrasion','emulsion_loss']}",
      "step_1_descreening":"{method:'multi_pass_frequency_notch',strength:'high',adaptive:true,edge_preserve:true}",
      "step_2_texture_suppression":"{method:'edge_aware_non_local_means',radius:'medium',aggressive:true,avoid_waxy:true}",
      "step_3_artifact_cleanup":"{method:'structure_preserving_inpainting',targets:['dust','scratches','chemical_marks','print_defects'],limit_fill:true}",
      "step_4_tonal_reconstruction":"{method:'continuous_tone_recovery',protect_highlights:true,protect_shadows:true}",
      "step_5_detail_rebalancing":"{method:'low_strength_edge_contrast',halo_prevention:true,ringing_prevention:true}",
  "colorization_mode":"{enabled:true,style:'modern_vibrant',palette:'realistic_natural',saturation:'moderate_plus',contrast:'modern_clean'}",
  "colorization_mapping":"{skin:'natural_true_to_life',hair:'realistic',clothing:'era_authentic',environment:'cohesive_realistic'}",
  "monochrome_protocol":"{remove_monochrome:true,allow_neutral_materials:true}",
  "camera_emulation":"{camera:'Hasselblad X2D 100C',sensor:'medium_format_100MP',lens:'XCD 80mm f1.9',look:'ultra_sharp_microcontrast_natural_color_science'}",
  "lighting_simulation":"{style:'soft_modern_studio',dynamic_range:'high',shadow_control:'clean_soft'}",
  "detail_sharpening":"{method:'edge_aware',strength:'moderate',no_fake_detail:true}",
  "noise_handling":"{textured_areas:'preserve_natural_grain',flat_areas:'smooth_uniform'}",
  "processing_style":"{look:'clean_timeless_modern',ai_artifacts:'none'}",
  "output_settings":"{resolution:'8K_equivalent',dpi:300,format:'PNG_or_TIFF',color_space:'sRGB'}",
  "negative_prompt":"['AI-generated_face_reconstruction_or_hallucinated_facial_details', 'plastic_skin','beauty_retouch','fake_sharpness','ai_texture','moire_patterns','face_modification','style_transfer','over_saturation']"
  "quality_metrics":"{fidelity:'high_to_original',color_accuracy:'photorealistic',sharpness:'maximum_without_artifacts'}",
}
`
      }
    ]
  },


// MENU STUDIO

  studio: {
    title: 'Studio',
    icon: '🎬',
    items: [

      {
        label: 'Half Body',
        prompt: `
{ "Task":"Edit into a professional studio-quality portrait comparable to Canon EOS R5 while preserving original face and pose",
  "Objective":"Upgrade image into a clean, sharp, studio-quality portrait with natural skin, premium lighting, and modern camera fidelity while strictly preserving identity, pose, expression, clothing style, and realism",
  "constraints":{"preserve_identity":true,"lock_face_geometry":true,"lock_features":["eyes","nose","lips","eyebrows","jawline","face_shape"],"preserve_expression":true,"preserve_pose":true,"no_face_reconstruction":true,"no_beautification":true,"no_body_reshaping":true},
  "Workflow":[
    {"step":"composition_control","framing":"three_quarter_body_mid_thigh_up","arms_visibility":"both_visible","orientation":"portrait","crop_policy":"do_not_crop_face_or_hands","zoom":"slight_zoom_out","keep_pose":true},
    {"step":"skin_and_face_retouch","skin_tone":"keep_original","skin_finish":"healthy_natural_radiant","skin_texture":"retain_fine_pores_no_plastic","blemish_policy":"light_temporary_only","hair_finish":"clean_neat_natural_shine","eyes_whites_desaturation":0.1,"eyes_iris_clarity":0.2,"teeth_whitening":0.08},
    {"step":"Render skin with real visible pores and slightly oily natural texture, including fine facial hair details without smoothing"},
    {"step":"clothing_refinement","policy":"upgrade_quality_keep_style_cut_color","fabric_look":"premium_fine_weave_crisp_edges","no_style_change":true},
    {"step":"studio_lighting","setup":"bright_soft_even_front","key_light":"beauty_dish_or_ring_light","fill_light":"broad_soft_fill","avoid_dramatic_lighting":true},
    {"step":"background_handling","policy":"preserve_100_percent_original","blur_type":"subtle_natural_bokeh","depth_of_field":"shallow_like_50mm_f1.8","subject_priority":"foreground_dominant","no_background_replacement":true},
    {"step":"camera_emulation","camera_body":"Canon_EOS_R5","lens":"50mm_f1.8_standard_prime","look":"ultra_sharp_microcontrast_natural_color_science"},
    {"step":"color_and_tone","skin_tone":"true_to_life","saturation":"moderate","contrast":"medium_soft_rolloff","no_color_stylization":true},
    {"step":"detail_and_sharpness","method":"edge_aware_sharpening","amount":0.35,"radius":0.8,"noise_reduction_luminance":0.2,"noise_reduction_chroma":0.25},
    {"step":"final_cleanup","remove_noise":true,"remove_artifacts":true,"fix_background_banding":true}],
  "Output":{"resolution":'8K_equivalent',"dpi":300,"format":"PNG","color_space":"sRGB_IEC61966-2.1","quality":"natural_photographic_realism","lighting":"studio_soft_even","ready_for":["digital","professional_print"]},
  "Negative Prompt":["pose_change","facial_expression_change","face_geometry_change","identity_drift","clothing_style_change","beautification","makeup_changes","facial_modification","body_reshaping","stylization","artistic_filter","painterly_effect","cinematic_drama","blur","background_objects_addition","color_shift_on_skin","color_shift_on_clothes","ai_face_reconstruction"],
  "Tradeoff":{"identity_accuracy":"very_high_but_not_forensic","facial_structure_lock":"strict","micro_detail_enhancement":"aggressive_but_realistic","skin_imperfection_retention":"allowed","editorial_attitude_priority":"high","pose_expression_flexibility":"moderate","stylization_limit":"editorial_realism_only","ai_hallucination_risk":"strictly_suppressed"}
  `
      },
      {
        label: 'Change Pose',
        prompt: `
"Objective":"Upgrade image into a clean, sharp, studio-quality portrait with natural skin, premium lighting, and modern camera fidelity while strictly preserving identity, clothing style",
  {"step_1":"Use the reference photo only as the facial identity base, preserve identity without reconstruction, alteration, or invented features"}
  {"step_2":"Reinterpret facial features with enhanced ultra-realistic detail including expressive pores, subtle skin imperfections, fine light reflections, and lifelike tangible textures"}
  {"step_3":"Create a bold contemporary Rankin-style portrait with strong attitude, confidence, and modern editorial character"}
  {"step_4":"Pose remains dynamic — head slightly tilted, shoulders angled, confident gaze or spontaneous expression such as laughter, smiling lips, smirk, or fierce stare"}
  {"step_5":"Apply bright clean studio lighting with crisp shadows and polished highlights sculpting the face"}
  {"step_6":"Maintain original background and editorial framing with ultra-high-definition focus on eyes, skin, and lips"}
  {"step_7":"Capture authenticity and charisma — powerful, unapologetic, modern, human — while retaining natural photographic realism"}
"Output":"resolution:'8K_equivalent',dpi:300, 16-bit depth, A3 print ready, ultra-high sharpness and clean edges, color_space: sRGB IEC61966-2.1, suitable for premium large-format photo exhibition printing"
"Negative Prompt":["face_geometry_change","identity_drift","clothing_style_change","beautification","makeup_changes","facial_modification","body_reshaping","stylization","artistic_filter","painterly_effect","cinematic_drama","blur","background_objects_addition","color_shift_on_skin","color_shift_on_clothes","ai_face_reconstruction"],
"Tradeoff":{"identity_accuracy":"very_high_but_not_forensic","facial_structure_lock":"strict","micro_detail_enhancement":"aggressive_but_realistic","skin_imperfection_retention":"allowed","stylization_limit":"editorial_realism_only","ai_hallucination_risk":"strictly_suppressed"}

`
      },
      {
        label: 'Indoor Studio',
        prompt: `
   Half-body portrait of [photo reference person], maintain 100% exact facial identity, structure, clothes, and skin tone from photo reference, elegant studio setup with Rembrandt lighting.
   Cinematic fine art style, warm painterly tones, textured dark vintage backdrop, soft directional key light from upper left.

   Gentle shadow falloff on one side of the face, 85mm lens depth, subtle film grain, ultra-realistic skin detail, natural body posture, calm and reflective expression.
   Eyes softly toward camera, sitting on vintage chair, body slightly turned, hands gently clasped, timeless editorial composition.
   Cinematic atmosphere, subtle lens diffusion glow, fine art realism, emotional storytelling.
   inspired by Annie Leibovitz, photographed for Vanity Fair, 8k ultra-detailed photography realism. 
   "negative_prompt": ["plastic skin", "harsh shadows", "color casts", "halo artifacts", "posterization/banding", "oversaturated skin"].
`
      },
      {
        label: 'Indoor Studio Family',
        prompt: `
{"step_1":"Preserve exact number of people and lock identity at 100%, optimize each subject individually without altering facial or bodily identity"},
{"step_2":"Apply strict face rules: keep hairstyle, hair color, eyebrows, eyelashes, eye color, nose shape, lip shape and color, facial hair, facial marks, ears and accessories exactly the same, enhance clarity and health only with natural pores and fine hair retained"},
{"step_3":"Apply strict body rules: preserve original body shape and pose exactly, keep the same clothing and accessories while making them clean, neat, and slightly vibrant like new"},
{"step_4":"Maintain natural vibrant color quality with balanced contrast, high but natural sharpness, and sRGB IEC61966-2.1 color profile"},
{"step_5":"Replace background with cinematic fine-art style inspired by Annie Leibovitz for Vanity Fair, using bright warm painterly tones, textured dark vintage backdrop, and dark coffee-colored oak wood patterned floor"},
{"step_6":"Ensure photorealistic output with professional quality and 100% identity accuracy"},
{"negative_prompt":"no pose change, no facial expression change, no clothing change, no beautification, no makeup changes, no facial modification, no body reshaping, no stylization, no artistic filter, no painterly effect, no cinematic drama, no blur, no added background objects beyond specified replacement, no color grading shift on clothes or skin, no AI face reconstruction"},
{"output":"export 16K resolution optimized for A3 print at 300 DPI, ultra-high resolution with sharp details and clean edges, natural photographic realism suitable for premium large-format photo exhibition printing"},
{"controls":"face_identity_lock 0.95, pose_lock 0.95, background_replace_strength 0.9, clothes_style_lock 0.85"}
`
      },
            {
        label: 'Intimate',
        prompt: `
  Using upload image, create an artistic close-up beauty portrait of a person with original color hair against a dark green background. 
  A charm smile, creating a poetic and mysterious visual effect. Their skin has a natural, dewy texture with visible freckles, and subtle highlights emphasize the contours of their face and collarbones. 
  The composition draws focus to the sharpen eyes and facial details, blending softness with raw expression.
  Style: hyperrealism, fine art portrait photography, moody lighting
      "composition": { "orientation": "portrait",  "crop_policy": "do_not_crop_face_or_hands", "keep_pose": true, "zoom": "slight zoom-out for wider context" }
      "lock_features": ["eyes", "nose", "lips", "eyebrows", "jawline", "face_shape"]
      "expression_policy": "preserve_original" }
      Camera Settings: ISO 100, aperture f/2.8, shutter speed 1/160s, 85mm prime lens
      Depth of Field: shallow, subject in sharp focus with a soft, blurred background
      Lighting: soft directional lighting to enhance texture and depth
      Color Palette: muted pinks, greens, warm skin tones
      "controls": { "face_identity_lock": 0.99, "pose_lock": 0.99, "background_replace_strength": 0.9, "clothes_style_lock": 0.99 },
      Mood: poetic, natural, mysterious, intimate
`
      },

      {
        label: 'Facing Camera',
        prompt: `
{
"task":"image_edit",
"output":{"resolution":"16K","dpi":300,"print_size":"A0","print_quality":"poster_grade"},
"pose":{"body_direction":"facing_camera","eye_gaze":"looking_at_camera"},
"face_constraints":{"preserve_identity":true,"change_level":"minimal","detail_accuracy":"high"},
"appearance":{"skin_tone":"smooth natural East Asian tone","eye_detail":"clear bright eyes facing camera","hair_detail":"highly detailed","realism":"ultra_realistic"},
"color_and_style":{"preset":"professional photo studio look","tone":"natural vibrant"},
"camera_emulation":{"camera":"Canon EOS R5 Mark II","lens":"50mm f1.2","lighting":"spotlight studio"},
"composition":{"aspect_ratio":"3:4","aspect_ratio_policy":"exact"}
}
`
      }

    ]
  },

// MENU PORTRAIT

  color: {
    title: 'Portrait',
    icon: '🎨',
    items: [
      {
        label: 'Close Up',
        prompt: `
Task: Edit into a professional studio-quality portrait comparable to Canon EOS R5 while preserving original facial structure and identity
Subject_Constraints: keep_identity=true → lock_structure=[skull,face_shape,jawline,eye_spacing,nose_structure,lip_volume] → expression_policy=flexible → pose_policy=flexible_with_identity_lock
Pipeline_SS_ID:
  step_1: Use the reference photo as the sole facial identity and structural base without reconstruction or feature invention
  step_2: Lock all facial structural geometry while allowing natural muscle-driven expression changes
  step_3: Allow pose variation including head tilt, angle, and gaze shift without altering facial proportions
  step_4: Reinterpret facial expression to convey emotion while preserving original anatomical consistency
  step_5: Enhance ultra-realistic skin micro-details including pores, fine lines, and natural texture
  step_6: Render eyes with realistic iris detail, natural catchlights, and expression-driven muscle tension
  step_7: Preserve lip volume and shape while allowing expression-based curvature changes
  step_8: Apply editorial studio lighting to sculpt the face without masking identity cues
  step_9: Maintain clean background and strong editorial framing with shallow depth of field
  step_10: Enforce ultra-photorealistic rendering with natural color science and controlled contrast
  step_11: Suppress beautification, stylization, and any non-anatomical facial alteration
Output: resolution=8K_equivalent → dpi=300 → format=PNG → color_space=sRGB_IEC61966-2.1 → quality=natural_photographic_realism → ready_for=[digital,professional_print]
Negative_Prompt: facial_structure_change → face_shape_modification → eye_resize → nose_reshape → jawline_alteration → lip_volume_change → identity_drift → beauty_morph → ai_face_reconstruction → stylization → painterly_effect
Tradeoff: identity_accuracy=very_high → structural_lock=absolute → expression_freedom=moderate_to_high → pose_flexibility=moderate → realism_priority=maximum → ai_hallucination_risk=strongly_suppressed
`
      },
      {
        label: 'Extreme Close',
        prompt: `
{"step_1":"Create a extreme macro portrait of the same person from the reference photo with close-up only face framing and strict identity preservation"},
{"step_2":"Simulate capture using a professional 100mm f/2.8 macro lens at true 1:1 magnification with multilayer focus stacking for perfect optical depth precision"},
{"step_3":"Render dry natural skin with visible fine pores and vellus hairs, preserving authentic texture without smoothing or cosmetic alteration"},
{"step_4":"Ensure ultra-sharp eyelashes and detailed iris reflections with precise optical clarity"},
{"step_5":"Apply soft diffused studio lighting with balanced key and fill, maintaining natural color tones and accurate white balance"},
{"step_6":"Achieve 16K-level hyperreal clarity with HDR tonal range and smooth edge falloff into neutral space"},
{"step_7":"Maintain pure natural photographic realism suitable for premium photo exhibition and large-format fine-art printing"},
{"negative_prompt":"No change in pose of any person, no change in facial expression, no change in clothing, no beautification, no makeup changes, no facial modification, no body reshaping, no stylization, no artistic filter, no painterly effect, no cinematic drama, no blur, no background objects, no color grading shift on clothes or skin, no AI face reconstruction, no moisture effect, no artificial background, pure optical realism and refined editorial precision"}
`
      },
      {
        label: 'Half Face',
        prompt: `
{"step_1":"Perform a hyper-realistic close-up edit using the reference photo with extreme close-up framing showing only the right half of the face starting from mid-nose, preserving exact identity"},
{"step_2":"Render skin with real visible pores and slightly oily natural texture, including fine facial hair details without smoothing"},
{"step_3":"Depict dark brown eyes with high sharpness and dramatic window-light reflections, maintaining optical realism"},
{"step_4":"Render thick, neat eyebrows with clearly visible individual hairs and natural density"},
{"step_5":"Render full lips with natural pink color and healthy moist appearance without cosmetic enhancement"},
{"step_6":"Apply natural window lighting to enhance skin shine and texture without cinematic stylization"},
{"step_7":"Use a soft-blurred blue background that remains minimal and non-distracting"},
{"step_8":"Maintain a serious, intense facial expression with no alteration"},
{"step_9":"Set focus priority strictly on the subject’s face with precise optical clarity"},
{"negative_prompt":"No change in pose of any person, no change in facial expression, no change in clothing, no beautification, no makeup changes, no facial modification, no body reshaping, no stylization, no artistic filter, no painterly effect, no cinematic drama, no blur, no background objects, no color grading shift on clothes or skin, no AI face reconstruction, no artificial moisture effects, no background replacement, pure optical realism and refined editorial precision"}
`
      },
      {
        label: 'Steve McCurry Style',
        prompt: `
{"step_1":"Create an editorial macro documentary portrait using the uploaded reference image with strict identity, geometry, expression, pose, and wardrobe locks enabled"},
{"step_2":"Apply a timeless humanist documentary style inspired by Steve McCurry with no stylization, no color fantasy, and no cinematic grading"},
{"step_3":"Simulate capture using a professional full-frame 14-bit CMOS camera with wide dynamic range and a 100mm f/2.8 macro lens at 1:1 magnification"},
{"step_4":"Set exposure to aperture f/2.8, shutter 1/160, ISO 100, EV 0 with manual precision focus on the nearest eye and multilayer optical focus stacking"},
{"step_5":"Frame a macro full-face portrait with neutral perspective at 6000x4000 resolution targeting 16K hyperreal clarity"},
{"step_6":"Preserve a piercing, intense frontal gaze conveying resilience, innocence, and lived experience through direct eye contact"},
{"step_7":"Use soft diffused directional lighting from a window-like large diffuser with balanced key and fill for intimate, authentic mood"},
{"step_8":"Maintain neutral to slightly warm white balance with true-to-life skin accuracy, controlled low saturation, natural vibrance, and realistic extended HDR"},
{"step_9":"Render eyes with extreme natural sharpness, original eye color, ultra-sharp lashes, high iris micro-detail, and real photographer-visible reflections only"},
{"step_10":"Render skin as dry and natural with visible fine pores, vellus hairs, micro-wrinkles, and natural redness, fully retained with no smoothing"},
{"step_11":"Preserve hair clean and neat, enhance texture only, apply minimal natural teeth whitening without cosmetic alteration"},
{"step_12":"Keep original or neutral background with smooth optical falloff and subject isolation driven purely by lens behavior"},
{"step_13":"Enforce post-processing constraints including no art filters, no AI face styling, no reshaping, no fake sharpening, and no over-denoising"},
{"step_14":"Finalize as an editorial-licensed, print-ready documentary portrait suitable for magazines, photostock, and archival use with pure optical realism"},
{"negative_prompt":"No change in pose of any person, no change in facial expression, no change in clothing, no beautification, no makeup changes, no facial modification, no body reshaping, no stylization, no artistic filter, no painterly effect, no cinematic drama, no blur, no background objects, no color grading shift on clothes or skin, no AI face reconstruction, no artificial moisture effects, no background replacement, pure optical realism and refined editorial precision"}
{"final_goal":"Deliver a 100% identity-faithful macro human-interest portrait with authentic texture, true eye reflections, and timeless documentary realism"}
`
      },
      {
        label: 'Rulie style',
        prompt: `
{"step_1":"Generate uploaded image using a Steve McCurry–inspired humanist documentary portrait aesthetic with strict consistency in lighting, color grading, and tonal response"}
{"step_2":"Use soft natural diffused light similar to shaded daylight or indirect window light with gentle falloff and soft shadows that create depth without harsh contrast; avoid artificial studio lighting or hard rim lights"}
{"step_3":"Apply wide but restrained dynamic range preserving highlight and shadow detail naturally with midtones as the primary emotional carrier and deep non-clipped blacks"}
{"step_4":"Use rich film-like controlled saturation where reds greens blues and earth tones remain vivid yet realistic with no neon or oversaturation"}
{"step_5":"Render skin tones warm earthy and natural with visible texture and realistic separation from the background; no smoothing beauty retouching or artificial glow"}
{"step_6":"Apply a cinematic film-inspired S-curve with slightly lifted textured blacks soft highlight roll-off and smooth midtone transitions while avoiding harsh micro-contrast or digital sharpness"}
{"step_7":"Preserve authentic surface texture including pores wrinkles dust fabric fibers and weathered details prioritizing realism over cleanliness"}
{"step_8":"Compose portrait centered or slightly off-center with shallow depth of field and eyes as the sharpest focal point while keeping the background soft minimal and non-distracting"}
{"step_9":"Emphasize human connection dignity resilience vulnerability and cultural identity through direct or emotionally charged gaze"}
{"step_10":"Maintain timeless analog-film documentary aesthetic reminiscent of classic National Geographic photography — authentic intimate emotionally grounded and not digitally stylized"}
{"step_11":"Apply analog documentary film LUT inspired by Kodachrome and early Fuji transparency film with warm midtones subtle cool shadows deep crimson-leaning reds natural rich greens muted cinematic blues smooth highlight roll-off and slightly lifted textured black point"}
{"step_12":"Enforce consistency constraints — natural light simulation priority identical tonal curve across generations constant saturation sharpest-contrast eyes preserved skin texture background never overpowering skin tones no drift toward fashion beauty or hyperrealism documentary feel only"}
{"style_keyword":"Steve McCurry documentary consistency, analog film LUT, natural soft light, rich realistic saturation, humanist portrait, National Geographic style"}
{"negative_prompt":"no pose change, no facial expression change, no clothing change, no beautification, no makeup changes, no facial modification, no body reshaping, no stylization, no artistic filter, no painterly effect, no cinematic drama, no blur, no background objects, no color grading shift on clothes or skin, no AI face reconstruction, no moisture, no background change, no artistic filters, pure optical realism and refined editorial precision"}
`
      },
      {
        label: 'Chiaroscuro Style',
        prompt: `
{"step_1":"Generate an ultra-detailed artistic close-up portrait from the uploaded image in a cinematic anamorphic headshot composition with the face positioned on the right side of the frame following the rule of thirds"}
{"step_2":"Ensure hazel eyes are looking upper-right with a distant melancholic and anxious expression, natural pink lips slightly parted showing upper teeth, conveying a vulnerable emotional mood"}
{"step_3":"Render hyper-realistic skin texture with natural facial contours and no airbrushing, prioritizing extreme realism"}
{"step_4":"Apply dramatic chiaroscuro lighting with a soft key light from the front-left illuminating the palm and left side of the face while the right side fades into deep shadow"}
{"step_5":"Use a pitch-black background with full subject isolation and no visible environmental elements"}
{"step_6":"Create a cinematic anamorphic aesthetic featuring horizontal anamorphic bokeh, subtle blue horizontal lens flare, oval bokeh highlights, and filmic contrast"}
{"step_7":"Use shallow depth of field with razor-sharp focus on the eyes and skin texture while foreground and background hair remain softly blurred"}
{"step_8":"Apply muted warm tones with beige-peach skin, dark brown hair, deep blacks, subtle gothic mood, dark art fine-art photography feel, studio shot, photorealistic high-contrast style with 8K detail"}
{"step_9":"Camera specification — 35mm anamorphic lens with cinematic film-still visual character"}
{"step_10":"Quality target — photorealistic, 8K, high contrast, extreme realism"}
{"step_11":"Lighting descriptor — chiaroscuro with soft key light from the front-left"}
{"step_12":"Background descriptor — pitch black full isolation"}
{"step_13":"Color tone — muted warm palette with beige-peach skin and deep blacks"}
`
      }


    ]
  },

// MENU Pas Foto


  pas_foto: {
    title: 'Pas Foto',
    icon: '💄',
    items: [
      {
        label: 'Pas Foto Pria / Wanita',
        prompt: `
{"step_1":"Create a macro portrait of the same person as the reference image, formatted strictly as a standard passport photograph with full identity preservation"},
{"step_2":"Apply close-up full-face framing and simulate optical capture using Canon EOS 5D Mark IV with Canon EF 50mm f/1.4 L USM at 1:1 magnification"},
{"step_3":"Use multilayer focus stacking to achieve perfect optical depth precision across face, eyes, and facial contours"},
{"step_4":"Position face and shoulders fully frontal to camera, eyes looking straight into lens, neutral head position with no tilt or rotation"},
{"step_5":"Set lips in a gentle friendly smile with relaxed expression suitable for official passport documentation"},
{"step_6":"Apply rule-of-thirds composition with eyes aligned on the upper one-third line while maintaining centered symmetrical balance"},
{"step_7":"Use portrait aspect ratio 3:4 (or equivalent passport framing), zoom out slightly to include upper body without overly tight facial crop"},
{"step_8":"Render natural dry skin with visible fine pores and vellus hairs, no digital makeup, no smoothing, no stylization"},
{"step_9":"Apply soft diffused studio lighting with balanced key and fill, accurate white balance, natural color tones, smooth falloff into neutral background"},
{"step_10":"Ensure ultra-sharp eyelashes, iris reflections, crisp edge clarity, 16K-level hyperreal detail, and HDR tonal range"},
{"step_11":"Maintain pure optical realism, color accuracy, editorial precision, and full compliance with global passport and ID photo standards"},
{"output":"final portrait in 3:4 ratio, perfectly lit, natural, high-clarity, ready for digital submission or high-quality printing"}
   `
      },
    ]
  },


// Black and White

  lighting: {
    title: 'Black and White',
    icon: '💡',
    items: [
      {
        label: 'BW Portrait',
        prompt: `
{"step_1":"Edit the uploaded photo using the reference face as identity base while preserving the same facial structure and skin tone with no alterations"}
{"step_2":"Convert the image into a black and white portrait with clean tonal rendering and photographic realism"}
{"step_3":"Ensure the hair appears neatly styled and the face shows strong defined features with a focused gaze"}
{"step_4":"Use a completely dark background to emphasize the subject’s face and attire with dramatic lighting that highlights facial contours and textures"}
{"step_5":"Apply soft light that enhances facial contours while shadows add depth, intensity, and emotional presence"}
{"step_6":"Maintain an overall mood that is sophisticated, intense, and elegant"}
{"step_7":"Camera specification — Canon EOS R, 50mm f/1.8 lens, aperture f/2.2, shutter 1/200s, ISO 100, natural light, half-body framing"}
{"step_8":"Image qualities — hyper realistic photography, cinematic, hyper detail, ultra HD, HDR, refined color grading behavior (even in monochrome), 8K rendering fidelity"}

`
      },
      {
        label: 'Chiaroscuro BW',
        prompt: `
{"step_1":"Generate a raw emotional noir portrait using the uploaded face exactly 100% true to identity"}
{"step_2":"Apply gritty black and white rendering with absolutely no color"}
{"step_3":"Use sun-like cold single light chiaroscuro with sweat visible on the skin"}
{"step_4":"Emphasize desperation in the eyes with raw vulnerability and charismatic tension"}
{"step_5":"Keep the background fully obscured by deep shadow symbolizing encroaching wilderness"}
{"step_6":"Render ultra realistic texture and facial detail with extreme photorealism"}
{"step_7":"Camera specification — 85mm lens at f/2.0 aperture"}
{"step_8":"Style — cinematic, dark, high contrast, photorealistic"}
{"step_9":"Mood — intense, desperate, vulnerable"}

`
      },

      {
        label: 'Hard Relight',
        prompt: `
{"step_1":"Use the uploaded reference image as the identity-locked base with strict facial structure preservation and matching aspect ratio"}
{"step_2":"Transform the original color photo into a dramatic black and white version while keeping the subject’s face visually popping from the background"}
{"step_3":"Enhance facial structure, contrast, and textures while maintaining a 100% identity match to the uploaded reference"}
{"step_4":"Target ultra-high detail photorealistic rendering at 8K-equivalent resolution quality"}
{"step_5":"Convert fully to black and white with zero tint, full desaturation, and neutral tone mapping"}
{"step_6":"Apply moderate brightness adjustments within controlled range to maintain natural tonal stability"}
{"step_7":"Use high contrast adjustments with values tuned for dramatic depth and presence"}
{"step_8":"Apply high sharpness with edge-aware sharpening using balanced radius and enhancement amount"}
{"step_9":"Adjust tone curves with a cinematic S-curve, boosting highlights and deepening shadows"}
{"step_10":"Tune levels to reinforce shadow depth, controlled midtones, and refined highlights"}
{"step_11":"Apply threshold refinement within a narrow micro-contrast adjustment range"}
{"step_12":"Boost highlights and recover shadows while preserving realism and texture fidelity"}
{"step_13":"Maintain neutral white balance with zero tint and neutral temperature response"}
{"step_14":"Preserve identity while enhancing eye detail realistically and maintaining natural visible skin texture and pores"}
{"step_15":"Emulate Canon EOS R5 with 50mm f/1.8 prime look — ultra-sharp micro-contrast and natural color science behavior"}
{"step_16":"Use three-quarter body framing from mid-thigh upward with no cropping of face or hands"}
{"step_17":"Apply bright soft even front lighting with straight-on key light and broad soft fill to avoid harsh shadows"}
{"step_18":"Output intent — suitable for high-end digital display, fine-art printing, museum-grade documentation, and archival restoration with editorial-safe rendering"}
`
      },
      {
        label: 'Infra Red Photography',
        prompt: `
{"step_1":"Convert the uploaded landscape photo into a full false-color infrared image without changing composition or subject"}
{"step_2":"Apply infrared channel swap (red-blue swap) to create classic false color rendering"}
{"step_3":"Turn all foliage and grass into bright glowing white-gold tones with strong luminous highlight detail"}
{"step_4":"Darken the entire sky to deep navy-cyan with high tonal contrast and dramatic IR mood"}
{"step_5":"Preserve trees and dry branches while enhancing edge contrast and fine micro-texture"}
{"step_6":"Keep animals and natural subjects photorealistic while adapting tonal palette to false color IR"}
{"step_7":"Use IR filter look equivalent to 720nm for strong foliage glow and dark sky separation"}
{"step_8":"Enhance global contrast, increase highlight rolloff, and deepen shadows without crushing texture"}
{"step_9":"Style — surreal false color infrared, cinematic landscape, photorealistic, high contrast"}
{"step_10":"Mood — otherworldly, dramatic, dreamlike, strong tonal separation"}
`
      }

    ]
  },


// UPSCALE

  upscale: {
    title: 'Upscale',
    icon: '🔍',
    items: [
      {
        label: 'Upscale 2×',
        prompt: `
Upscale image 2x.
Preserve fine detail.
No halos or artifacts.
`
      },
      {
        label: 'Upscale 4×',
        prompt: `
Upscale image 4x.
High detail retention.
Print-ready quality.
`
      },
      {
        label: 'Upscale 8×',
        prompt: `
Upscale image up to 8x.
Maximum detail preservation.
Avoid artificial sharpening.
`
      }
    ]
  },


// CREATIVE

  creative: {
    title: 'Creative',
    icon: '✨',
    items: [
      {
        label: 'Smudge Painting',
        prompt: `
{
"task":"photo_restoration_and_modern_enhancement",
"objective":"restore old photo, remove damage, add period-appropriate color, cinematic depth, preserve authenticity",
"upscale":{"amount":"300%","preserve":"fine texture facial detail edge sharpness","color_lighting_change":false},
"audience":"new_generation",
"identity":{"keep":true,"lock_features":["eyes","nose","lips","eyebrows","jawline","face_shape"],"expression":"preserve"},
"skin":{"style":"high_quality_smudge_painting","finish":"smooth blended","detail":"retain fine pores vellus hairs"},
"hair":{"finish":"clean neat wet shiny"},
"eyes":{"whites_desaturation":0.9,"iris_clarity":0.1},
"teeth":{"natural_whiten":1},
"background":{"effect":"soft cinematic bokeh","lens_emulation":"full_frame f1.8"},
"lighting":{"type":"soft ambient balanced","tone_match":"timeless natural"},
"color_tone":{"overall":"true_to_life skin","saturation":"moderate","contrast":"medium soft_rolloff"},
"sharpness":{"method":"edge_aware","amount":0.45,"radius":0.8},
"noise_reduction":{"luminance":0.5,"chroma":0.5},
"cleanup":{"remove_noise":true,"remove_artifacts":true,"banding_fix_background":true},
"camera_emulation":{"camera":"Canon EOS R5","lens":"50mm f1.8"},
"controls":{"face_identity_lock":0.99,"pose_lock":0.99,"background_replace_strength":0.99,"clothes_style_lock":0.99},
"output":{"aspect_ratio":"3:4","resolution":"8K","dpi":300,"format":"PNG","color_space":"sRGB IEC61966-2.1"},
"negative_prompt":["plastic skin","harsh shadows","color casts","halo artifacts","change background","posterization","banding","oversaturated skin"]
}
`},

      {
        label: 'Cartoon Pixar',
        prompt: `
{"step_1":"Create a hyper-realistic 3D cartoon version of the character in the reference image with big-head chibi proportions (large head and small body)"}
{"step_2":"Preserve facial identity 100% accurately with detailed skin texture, natural glow, soft shadows, and precisely shaped hair"}
{"step_3":"Keep the character in their original outfit with realistic fabric texture and material fidelity"}
{"step_4":"Use professional studio lighting with a neutral grey background and subtle blur separation"}
{"step_5":"Apply Pixar-style aesthetic with friendly expression, dynamic posture, slightly forward-inclined body and expressive body gestures"}
{"step_6":"Render as a collectible figure in 4K resolution with realistic polished finish and premium presentation quality"}
{"negative_prompt":"no pose change, no facial expression change, no clothing change, no beautification, no makeup changes, no facial modification, no body reshaping, no stylization, no artistic filter, no painterly effect, no cinematic drama, no blur, no background objects, no color grading shift on clothes or skin, no AI face reconstruction, no moisture, no background change, no artistic filters, pure optical realism and refined editorial precision"}
`},

      { label: 'Cartoon Donghua style',
        prompt: `
  Create a fully stylized donghua character portrait based on the uploaded reference photo, but keep the facial identity exactly the same as the reference—including face shape, eyebrows, nose structure, mouth shape, beard pattern, hairstyle, and overall proportions.
  Do not create a new face or alter key facial landmarks.
  Transform the photo into a clean donghua aesthetic with:
    large but still proportional expressive eyes
    smooth skin with no pores
    simplified nose bridge
    soft cel-shading
    tapered, elegant line art
    glossy donghua-style hair highlights
  Maintain the same pose, head angle, expression, and lighting direction as the reference.
  Color palette should be adjusted to a harmonious donghua tone:
  skin: soft peach
  hair: deep black or natural brown with stylized highlights
  clothing: adapt from the original colors but make them flat and clean
  shading: soft cel-shading, non-realistic
  Background: soft pastel gradient that enhances the donghua style.
  The final result must be clearly animated and non-realistic, but the face, expression, and proportions must stay faithful to the reference photo.
`},

      { label: 'Cartoon Painting',
        prompt: `
  Stylized digital illustration,semi-realistic of a person (photo reference) riding a white Royal Enfield Bullet 500 motorcycle in snowy winter in Ladakh at sunset, Snow mountain available.
  Facing the viewer, confident pose, with big-head natural style (10–15% larger head) but realistic details, accurate face likeness.
  Stylized soft semi-realistic digital painting, smooth lighting, misty rain, soft shading, wet reflections, and cinematic atmosphere blending warm and cool tones.
  Maintain realistic perspective and natural human proportions, but infuse the gentle color harmony, soft shading, and expressive warmth characteristic of storybook-style art. 
  Capture the feeling of quiet solitude under light winter, yet with visual warmth and richness in every detail, 8K.
`},

      { label: 'Creative – Fantasy',
        prompt: `
Fantasy portrait mood.
Dreamy lighting and colors.
Magical realism aesthetic.
`}
    ]
  },

// UTILITY


  utility: {
    title: 'Utility',
    icon: '⚙️',
    items: [
      {
        label: 'Utility – Background Clean',
        prompt: `
Clean and simplify background.
Remove distractions.
Preserve original scene.
`
      },
      {
        label: 'Utility – Sharpen Only',
        prompt: `
Apply controlled sharpening.
Enhance edges naturally.
Avoid artifacts.
`
      },
      {
        label: 'Utility – Noise Reduction',
        prompt: `
Reduce noise and grain.
Preserve detail and texture.
Natural clean output.
`
      }
    ]
  }
};

export default promptCategories;
