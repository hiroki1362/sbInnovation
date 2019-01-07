// 
// MMD�W���̃V�F�[�_���g�p���邪�����Ȃ��Ȃ������ߕW���V�F�[�_�[���ۂ��̂����蓖�Ă�
//
////////////////////////////////////////////////////////////////////////////////////////////////
//  FurShader
//     �є�V�F�[�_�[
//		Program by T.Ogura
//		�iMME/��{�V�F�[�_�[���� ���͉��P)
////////////////////////////////////////////////////////////////////////////////////////////////
// �уV�F�[�_�[�p�@�R���g���[���p�����[�^

const float FurSupecularPower = 0.5;      // �т̌���͈�
const float FurFlowScale = float2(100,1); // �т̗�����
const float3 FurColor = float3(0.2, 0.2, 0.2); // �т̐F

int FurShellCount = 20; // FurShell�̖���
const float FurLength = 0.02;  // FurShell�̕�

//��񂱃J�X�^���ǋL���BBrushed�v���X
//#define SkinBrushedColor float3(0.3,0.3,0.3)		// �n���̐F ��`���Ȃ���΍ގ��E�e�N�X�`���̐F RGB
//#define FurBrushedColor float3(1,1,1)	// �т̐F ��`���Ȃ���΍ގ��E�e�N�X�`���̐F RGB
#define FurBrushedPower 0.1			// �т̒���?
////////////////////////////////////////////////////////////////////////////////////////////////
// �p�����[�^�錾

// ���@�ϊ��s��
float4x4 WorldViewProjMatrix      : WORLDVIEWPROJECTION;
float4x4 WorldMatrix              : WORLD;
float4x4 ViewMatrix               : VIEW;
float4x4 LightWorldViewProjMatrix : WORLDVIEWPROJECTION < string Object = "Light"; >;

float3   LightDirection    : DIRECTION < string Object = "Light"; >;
float3   CameraPosition    : POSITION  < string Object = "Camera"; >;

// �}�e���A���F
float4   MaterialDiffuse   : DIFFUSE  < string Object = "Geometry"; >;
float3   MaterialAmbient   : AMBIENT  < string Object = "Geometry"; >;
float3   MaterialEmmisive  : EMISSIVE < string Object = "Geometry"; >;
float3   MaterialSpecular  : SPECULAR < string Object = "Geometry"; >;
float    SpecularPower     : SPECULARPOWER < string Object = "Geometry"; >;
float3   MaterialToon      : TOONCOLOR;
// ���C�g�F
float3   LightDiffuse      : DIFFUSE   < string Object = "Light"; >;
float3   LightAmbient      : AMBIENT   < string Object = "Light"; >;
float3   LightSpecular     : SPECULAR  < string Object = "Light"; >;
static float4 DiffuseColor  = MaterialDiffuse  * float4(LightDiffuse, 1.0f);
static float3 AmbientColor  = saturate(MaterialAmbient  * LightAmbient + MaterialEmmisive);
static float3 SpecularColor = MaterialSpecular * LightSpecular;

bool     parthf;   // �p�[�X�y�N�e�B�u�t���O
bool     transp;   // �������t���O
bool	 spadd;    // �X�t�B�A�}�b�v���Z�����t���O
#define SKII1    1500
#define SKII2    8000
#define Toon     1

// �I�u�W�F�N�g�̃e�N�X�`��
texture ObjectTexture: MATERIALTEXTURE;
sampler ObjTexSampler = sampler_state {
    texture = <ObjectTexture>;
    MINFILTER = LINEAR;
    MAGFILTER = LINEAR;
};
// �X�t�B�A�}�b�v�̃e�N�X�`��
texture ObjectSphereMap: MATERIALSPHEREMAP;
sampler ObjSphareSampler = sampler_state {
    texture = <ObjectSphereMap>;
    MINFILTER = LINEAR;
    MAGFILTER = LINEAR;
};

///////////////////////////////////////////////////////////////////////////////////////////////
// �I�u�W�F�N�g�`��i�Z���t�V���h�EON�j

// �V���h�E�o�b�t�@�̃T���v���B"register(s0)"�Ȃ̂�MMD��s0���g���Ă��邩��
sampler DefSampler : register(s0);

struct BufferShadow_OUTPUT {
    float4 Pos      : POSITION;     // �ˉe�ϊ����W
    float4 ZCalcTex : TEXCOORD0;    // Z�l
    float2 Tex      : TEXCOORD1;    // �e�N�X�`��
    float3 Normal   : TEXCOORD2;    // �@��
    float3 Eye      : TEXCOORD3;    // �J�����Ƃ̑��Έʒu
    float2 SpTex    : TEXCOORD4;	 // �X�t�B�A�}�b�v�e�N�X�`�����W
    float4 Color    : COLOR0;       // �f�B�t���[�Y�F
};

//-----------------------------------------------------------------------------------------------

int nFur;               // ���ݕ`�撆��FurShell�ԍ�

texture2D fur_tex <
   string ResourceName = "a_tex_fur.tga";// Fur�����e�N�X�`���B�t���̃e�N�X�`���͕��̃{�^�������͍����Ȃ��Ă���
   int Miplevels = 3;
>;
sampler FurSampler = sampler_state {
   texture = <fur_tex>;
};

//-----------------------------------------------------------------------------------------------

int nFurDepth;               // ��񂱃J�X�^���ǋL���BFurShell�̕`�ʐ[�x

texture2D fur_tex_depth <
   string ResourceName = "a_tex_fur_depth.tga";// Furdepth�����e�N�X�`��
   int Miplevels = 3;
>;
sampler FurDepSampler = sampler_state {
   texture = <fur_tex_depth>;
};

//-----------------------------------------------------------------------------------------------

// ���_�V�F�[�_ �i��{�`�C���̂��ߕs�K�v�Ȍv�Z�����Ă�j
BufferShadow_OUTPUT Fur_VS(float4 Pos : POSITION, float3 Normal : NORMAL, float2 Tex : TEXCOORD0, uniform bool useToon)
{
    BufferShadow_OUTPUT Out = (BufferShadow_OUTPUT)0;

    // �J�������_�̃��[���h�r���[�ˉe�ϊ�
    Out.Pos = mul( Pos+float4(Normal.xyz*FurLength,0)*nFur, WorldViewProjMatrix ); // FurShell��@�������ɖc��܂���
    
    Out.Eye = CameraPosition - mul( Pos, WorldMatrix );
    Out.Normal = normalize( mul( Normal, (float3x3)WorldMatrix ) );
    Out.ZCalcTex = mul( Pos, LightWorldViewProjMatrix );
    // �f�B�t���[�Y�F�{�A���r�G���g�F �v�Z
    Out.Color.rgb = AmbientColor;
    if ( !useToon ) {
        Out.Color.rgb += max(0,dot( Out.Normal, -LightDirection )) * DiffuseColor.rgb;
    }
    Out.Color.a = DiffuseColor.a;
    Out.Color = saturate( Out.Color );

    Out.Tex = Tex;// �e�N�X�`�����W
    return Out;
}
float ftime : TIME <bool SyncInEditMode=false;>;

float4 Fur_PS(BufferShadow_OUTPUT IN,  uniform bool useToon) : COLOR
{

	float4 Color = IN.Color;
	
    // �X�y�L�����F�v�Z
    //float3 HalfVector = normalize( normalize(IN.Eye) ); // �т̌�����B�D�݂̖�肩��
	float3 HalfVector = normalize( normalize(IN.Eye)  + -LightDirection );
	
	//Specular����FurSpecular�֖��O��ύX�BSpecular�̌v�Z��V�K�ɒǉ�(Specular�̌v�Z����Brushed�Ɠ���
    float3 FurSpecular = 1.0-pow( max(0,dot( HalfVector, normalize(IN.Normal) )), FurSupecularPower ) * float3(1,1,1);
    float3 Specular = pow( max(0,dot( HalfVector, normalize(IN.Normal) )), SpecularPower ) * SpecularColor; //�e�X�g
	Color.rgb += Specular;//�e�X�g
	
 	float4 TexColor =  tex2D( ObjTexSampler, IN.Tex );   // �e�N�X�`���J���[
	Color *= TexColor;

    float2 furDir = float2(1.0, 0.0);
	
	//-----------------------------------------------------------------------------------------------

//	����񂱃J�X�^���ǋL���BFurDep�e�N�X�`������t�@�[�V�F�����̊��������߂�
	float4 furdep = tex2D( FurDepSampler, IN.Tex);
//	nFurDepth = FurShellCount * furdep.r;
	nFurDepth = FurShellCount;//���}���u�p
		
		// �т̏���
	// �n���̐F
#ifdef SkinBrushedColor
	float3 skin = SkinBrushedColor;
#else
	float3 skin = Color.rgb;
#endif

	// �т̐F
#ifdef FurBrushedColor
	float3 fur = FurBrushedColor;
#else
	float3 fur = Color.rgb;
#endif
    Color.rgb = lerp(fur, skin, pow(abs(dot(normalize(IN.Eye),-normalize(IN.Normal))), FurBrushedPower));
    if( transp ) Color.a *= 0.5f;
	
	
    Color.rgb = lerp( Color, Color + FurColor, FurSpecular.r); // Specular.r�ɂ����TexColor -> FurColor�ɕω�������
//    Color.rgb = lerp( float3(0,0,0), FurColor, Specular.r); // �ŏ��̔Łi����j�͂�����

	//-----------------------------------------------------------------------------------------------

	
	// ���˂��˂Ȏ���(GPU�ɒ�������)
	//float2 furDire = float2(sin(ftime+IN.Tex.x*20),cos(ftime+IN.Tex.y*40));
    //Color.rgb = float3(1.0-(furDir.x+1.0)/2.0,(furDir.x+1.0)/2.0,(furDir.y+1.0)/2.0) * Specular.r;
     
     // �уe�N�X�`������ѕ����̃A���t�@������B�ѐ�ɍs���قǔ����Ȃ�
//	��񂱃J�X�^���ǋL���B�[�x�e�N�X�`���Ŗт̒���������B���ȏ�Ŗт̕`�ʂ�؂�
    if(nFur < nFurDepth) {
		Color.a = tex2D( FurSampler, IN.Tex- furDir / FurFlowScale * nFur).r * (1.0-nFur/(FurShellCount-1.0)); 
    }else{
    	Color.a = 0;
    }
	// return Color; // Fur�ɑ΂���Z���t�V���h�E�͂��܂�ǂ��Ȃ��̂ŁA�����őł��؂�̂�����
    
    // �e�N�X�`�����W�ɕϊ�
    IN.ZCalcTex /= IN.ZCalcTex.w;
    float2 TransTexCoord;
    TransTexCoord.x = (1.0f + IN.ZCalcTex.x)*0.5f;
    TransTexCoord.y = (1.0f - IN.ZCalcTex.y)*0.5f;
	
    if( any( saturate(TransTexCoord) != TransTexCoord ) ) { 
        return Color;
    } else {
        float comp;
        if(parthf) {
            // �Z���t�V���h�E mode2
            comp=1-saturate(max(IN.ZCalcTex.z-tex2D(DefSampler,TransTexCoord).r , 0.0f)*SKII2*TransTexCoord.y-0.3f);
        } else {
            // �Z���t�V���h�E mode1
            comp=1-saturate(max(IN.ZCalcTex.z-tex2D(DefSampler,TransTexCoord).r , 0.0f)*SKII1-0.3f);
        }
        return Color * ( 0.7 +  comp *0.3) ; // �e�̏��͏����Â�����
    }
}
struct VS_OUTPUT {
    float4 Pos        : POSITION;    // �ˉe�ϊ����W
    float2 Tex        : TEXCOORD1;   // �e�N�X�`��
    float3 Normal     : TEXCOORD2;   // �@��
    float3 Eye        : TEXCOORD3;   // �J�����Ƃ̑��Έʒu
    float2 SpTex      : TEXCOORD4;	 // �X�t�B�A�}�b�v�e�N�X�`�����W
    float4 Color      : COLOR0;      // �f�B�t���[�Y�F
};

// ���_�V�F�[�_
VS_OUTPUT Basic_VS(float4 Pos : POSITION, float3 Normal : NORMAL, float2 Tex : TEXCOORD0, uniform bool useTexture, uniform bool useSphereMap, uniform bool useToon)
{
    VS_OUTPUT Out = (VS_OUTPUT)0;
   
    // �J�������_�̃��[���h�r���[�ˉe�ϊ�
    Out.Pos = mul( Pos, WorldViewProjMatrix );
   
    // �J�����Ƃ̑��Έʒu
    Out.Eye = CameraPosition - mul( Pos, WorldMatrix );
    // ���_�@��
    Out.Normal = normalize( mul( Normal, (float3x3)WorldMatrix ) );
  
    // �f�B�t���[�Y�F�{�A���r�G���g�F �v�Z
    Out.Color.rgb = AmbientColor;
    if ( !useToon ) {
        Out.Color.rgb += max(0,dot( Out.Normal, -LightDirection )) * DiffuseColor.rgb;
    }
    Out.Color.a = DiffuseColor.a;
    Out.Color = saturate( Out.Color );
     
    // �e�N�X�`�����W
    Out.Tex = Tex;
    
    if ( useSphereMap ) {
        // �X�t�B�A�}�b�v�e�N�X�`�����W
        float2 NormalWV = mul( Out.Normal, (float3x3)ViewMatrix );
        Out.SpTex.x = NormalWV.x * 0.5f + 0.5f;
        Out.SpTex.y = NormalWV.y * -0.5f + 0.5f;
    }
    
    return Out;
}

// �s�N�Z���V�F�[�_
float4 Basic_PS(VS_OUTPUT IN, uniform bool useTexture, uniform bool useSphereMap, uniform bool useToon) : COLOR0
{
    float4 Color = IN.Color;

    // �X�y�L�����F�v�Z
    float3 HalfVector = normalize( normalize(IN.Eye) + -LightDirection );
    float3 Specular = pow( max(0,dot( HalfVector, normalize(IN.Normal) )), SpecularPower ) * SpecularColor;
    
    if ( useTexture ) {
        // �e�N�X�`���K�p
        Color *= tex2D( ObjTexSampler, IN.Tex );
    }

    if ( useSphereMap ) {
        // �X�t�B�A�}�b�v�K�p
        if(spadd) Color.rgb += tex2D(ObjSphareSampler,IN.SpTex).rgb;
        else      Color.rgb *= tex2D(ObjSphareSampler,IN.SpTex).rgb;
    }

    if ( useToon ) {
        // �g�D�[���K�p
        float LightNormal = dot( IN.Normal, -LightDirection );
        Color.rgb *= lerp(MaterialToon, float3(1,1,1), saturate(LightNormal * 16 + 0.5));
    }
    
    // �X�y�L�����K�p
    Color.rgb += Specular;
   
    return Color;
}

// 11�Ԃ��W���P�b�g�����̃��f��
// �e�N�X�`�����K�p���ꂽ���f���̂ݑΉ�
technique MainTecBS5  <
	string MMDPass = "object_ss";
	string subSet="0-3,16-24";
	bool UseTexture = true; bool UseToon = true;

       string Script =
	       "Pass = DrawObject;"
           "LoopByCount=FurShellCount;"
           "LoopGetIndex=nFur;"
           "Pass=Fur;"
           "LoopEnd=;"
;

> {
    // ���n�̃W���P�b�g���f�B�t�H���g�V�F�[�_�[�ŕ`�悷��
    pass DrawObject {
		// ��������ŕW���V�F�[�_�[���g�����Ƃ���Ɠ����Ȃ��@2013/09/30 
        VertexShader = compile vs_2_0 Basic_VS(true,false,true);
        PixelShader  = compile ps_2_0 Basic_PS(true,false,true);
    }
    // �уV�F�[�_�[
    pass Fur {
	    AlphaBlendEnable = TRUE;
		ZEnable      = TRUE;
		ZWriteEnable = false; // �ѕ�����Depth�o�b�t�@���X�V���Ȃ�
		CULLMODE = CCW;

        VertexShader = compile vs_2_0 Fur_VS(true);
        PixelShader  = compile ps_2_0 Fur_PS(true);

    }	
}
