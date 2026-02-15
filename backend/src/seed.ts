import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Company
    const company = await prisma.company.upsert({
        where: { code: 'OPEX' },
        update: {},
        create: {
            code: 'OPEX',
            name: 'OpEx Şirketi',
            description: 'Ana şirket',
        },
    });

    console.log('✅ Company created:', company.name);

    // Create Department
    const department = await prisma.department.upsert({
        where: { code: 'IT' },
        update: {},
        create: {
            code: 'IT',
            name: 'Bilgi Teknolojileri',
            description: 'IT Departmanı',
            companyId: company.id,
        },
    });

    console.log('✅ Department created:', department.name);

    // Create Unit
    const unit = await prisma.unit.upsert({
        where: { code: 'IT-DEV' },
        update: {},
        create: {
            code: 'IT-DEV',
            name: 'Yazılım Geliştirme',
            description: 'Yazılım Geliştirme Şefliği',
            departmentId: department.id,
        },
    });

    console.log('✅ Unit created:', unit.name);

    // Create Admin User
    const hashedPassword = await bcrypt.hash('Admin123', 12);

    const admin = await prisma.user.upsert({
        where: { employeeId: 'ADMIN001' },
        update: {},
        create: {
            employeeId: 'ADMIN001',
            email: 'admin@opex5.com',
            password: hashedPassword,
            firstName: 'Sistem',
            lastName: 'Yöneticisi',
            position: 'Sistem Yöneticisi',
            companyId: company.id,
            departmentId: department.id,
            unitId: unit.id,
            role: 'ADMIN',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });

    console.log('✅ Admin user created:', admin.email);
    console.log('   Employee ID: ADMIN001');
    console.log('   Password: Admin123');

    // Create Test User
    const testUserPassword = await bcrypt.hash('Test1234', 12);

    const testUser = await prisma.user.upsert({
        where: { employeeId: 'USER001' },
        update: {},
        create: {
            employeeId: 'USER001',
            email: 'user@opex5.com',
            password: testUserPassword,
            firstName: 'Test',
            lastName: 'Kullanıcı',
            position: 'Uzman',
            companyId: company.id,
            departmentId: department.id,
            unitId: unit.id,
            role: 'USER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });

    console.log('✅ Test user created:', testUser.email);
    console.log('   Employee ID: USER001');
    console.log('   Password: Test1234');

    // Create Committee Manager
    const committeeManagerPassword = await bcrypt.hash('Komite1234', 12);

    const committeeManager = await prisma.user.upsert({
        where: { employeeId: 'KOMITE001' },
        update: {},
        create: {
            employeeId: 'KOMITE001',
            email: 'komite@opex5.com',
            password: committeeManagerPassword,
            firstName: 'Komite',
            lastName: 'Yöneticisi',
            position: 'Komite Başkanı',
            companyId: company.id,
            departmentId: department.id,
            role: 'COMMITTEE_MANAGER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });

    console.log('✅ Committee Manager created:', committeeManager.email);
    console.log('   Employee ID: KOMITE001');
    console.log('   Password: Komite1234');

    // Create Approver (Manager)
    const approverPassword = await bcrypt.hash('Onay1234', 12);

    const approver = await prisma.user.upsert({
        where: { employeeId: 'MUDUR001' },
        update: {},
        create: {
            employeeId: 'MUDUR001',
            email: 'mudur@opex5.com',
            password: approverPassword,
            firstName: 'Müdür',
            lastName: 'Bey',
            position: 'Müdür',
            companyId: company.id,
            departmentId: department.id,
            role: 'APPROVER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });

    console.log('✅ Approver created:', approver.email);
    console.log('   Employee ID: MUDUR001');
    console.log('   Password: Onay1234');

    // Create Stage Approvers for multi-step hierarchy
    const chiefApproverPassword = await bcrypt.hash('SefOnay1234', 12);
    const chiefApprover = await prisma.user.upsert({
        where: { employeeId: 'SEF001' },
        update: {},
        create: {
            employeeId: 'SEF001',
            email: 'sef@opex5.com',
            password: chiefApproverPassword,
            firstName: 'Şef',
            lastName: 'Onay',
            position: 'Şef',
            companyId: company.id,
            departmentId: department.id,
            role: 'APPROVER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });
    console.log('✅ Chief Approver created:', chiefApprover.email);
    console.log('   Employee ID: SEF001');
    console.log('   Password: SefOnay1234');

    const factoryManagerPassword = await bcrypt.hash('Fabrika1234', 12);
    const factoryManagerApprover = await prisma.user.upsert({
        where: { employeeId: 'FAB001' },
        update: {},
        create: {
            employeeId: 'FAB001',
            email: 'fabrika@opex5.com',
            password: factoryManagerPassword,
            firstName: 'Fabrika',
            lastName: 'Müdürü',
            position: 'Fabrika Müdürü',
            companyId: company.id,
            departmentId: department.id,
            role: 'APPROVER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });
    console.log('✅ Factory Manager Approver created:', factoryManagerApprover.email);
    console.log('   Employee ID: FAB001');
    console.log('   Password: Fabrika1234');

    const gmyPassword = await bcrypt.hash('GmyOnay1234', 12);
    const gmyApprover = await prisma.user.upsert({
        where: { employeeId: 'GMY001' },
        update: {},
        create: {
            employeeId: 'GMY001',
            email: 'gmy@opex5.com',
            password: gmyPassword,
            firstName: 'Genel',
            lastName: 'Müdür Yardımcısı',
            position: 'GMY',
            companyId: company.id,
            departmentId: department.id,
            role: 'APPROVER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });
    console.log('✅ GMY Approver created:', gmyApprover.email);
    console.log('   Employee ID: GMY001');
    console.log('   Password: GmyOnay1234');

    // Create submitter personas for approval matrix tests
    const operatorPassword = await bcrypt.hash('Operator1234', 12);
    const operatorUser = await prisma.user.upsert({
        where: { employeeId: 'OPER001' },
        update: {},
        create: {
            employeeId: 'OPER001',
            email: 'operator@opex5.com',
            password: operatorPassword,
            firstName: 'Operatör',
            lastName: 'Kullanıcı',
            position: 'Operatör',
            companyId: company.id,
            departmentId: department.id,
            unitId: unit.id,
            role: 'USER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });
    console.log('✅ Operator user created:', operatorUser.email);
    console.log('   Employee ID: OPER001');
    console.log('   Password: Operator1234');

    const chiefSubmitterPassword = await bcrypt.hash('SefKullanici1234', 12);
    const chiefSubmitter = await prisma.user.upsert({
        where: { employeeId: 'SEFUSR001' },
        update: {},
        create: {
            employeeId: 'SEFUSR001',
            email: 'sef.kullanici@opex5.com',
            password: chiefSubmitterPassword,
            firstName: 'Şef',
            lastName: 'Kullanıcı',
            position: 'Şef',
            companyId: company.id,
            departmentId: department.id,
            unitId: unit.id,
            role: 'USER',
            status: 'PENDING_PASSWORD_CHANGE',
        },
    });
    console.log('✅ Chief submitter user created:', chiefSubmitter.email);
    console.log('   Employee ID: SEFUSR001');
    console.log('   Password: SefKullanici1234');

    // Create Suggestions
    const suggestionsData = [
        {
            title: 'Ofis Işıklandırması Optimizasyonu',
            currentSituation: 'Ofis ışıkları tüm gün açık kalıyor.',
            proposedSolution: 'Hareket sensörlü sisteme geçilmesi.',
            estimatedSavings: 5000.0,
            status: 'APPROVED',
            userId: testUser.id,
            companyId: company.id,
            departmentId: department.id,
        },
        {
            title: 'Kağıt İsrafının Azaltılması',
            currentSituation: 'Gereksiz çıktılar alınıyor.',
            proposedSolution: 'Dijital imza sürecine geçilmesi.',
            estimatedSavings: 2000.0,
            status: 'PENDING',
            userId: testUser.id,
            companyId: company.id,
            departmentId: department.id,
        },
        {
            title: 'Eski Sunucuların Sanallaştırılması',
            currentSituation: 'Eski fiziksel sunucular çok enerji harcıyor.',
            proposedSolution: 'Sanallaştırma platformuna taşıma.',
            estimatedSavings: 15000.0,
            status: 'COMPLETED',
            userId: admin.id,
            companyId: company.id,
            departmentId: department.id,
        }
    ];

    for (const s of suggestionsData) {
        await prisma.suggestion.create({
            data: {
                ...s,
                gainCategories: '["COST_SAVING"]', // Mock JSON string
                referenceNumber: `REF-${Math.floor(Math.random() * 10000)}`,
            }
        });
    }
    console.log(`✅ Created ${suggestionsData.length} suggestions.`);

    // Create Email Templates
    const emailTemplates = [
        {
            code: 'welcome',
            name: 'Hoşgeldiniz',
            subject: 'OpEx 5.0\'a Hoşgeldiniz - {{employeeName}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Hoşgeldiniz, {{employeeName}}!</h2>
                <p>OpEx 5.0 Öneri Yönetim Sistemi'ne hoşgeldiniz.</p>
                <p>Hesabınız oluşturulmuştur. İlk girişinizde şifrenizi değiştirmeniz gerekecektir.</p>
                <p><strong>Kullanıcı Kodunuz:</strong> {{employeeId}}</p>
                <p><strong>Geçici Şifreniz:</strong> {{temporaryPassword}}</p>
                <p>Giriş yapmak için: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["employeeName", "employeeId", "temporaryPassword", "loginUrl"]',
        },
        {
            code: 'password-reset',
            name: 'Şifre Sıfırlama',
            subject: 'OpEx 5.0 - Şifre Sıfırlama Talebi',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Şifre Sıfırlama</h2>
                <p>Merhaba {{employeeName}},</p>
                <p>Şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanabilirsiniz:</p>
                <p><a href="{{resetUrl}}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Şifremi Sıfırla</a></p>
                <p>Bu bağlantı 1 saat süreyle geçerlidir.</p>
                <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["employeeName", "resetUrl"]',
        },
        {
            code: 'suggestion-submitted',
            name: 'Öneri Gönderildi',
            subject: 'Öneriniz Alındı - {{referenceNumber}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Öneriniz Alındı</h2>
                <p>Merhaba {{employeeName}},</p>
                <p>Öneriniz başarıyla gönderildi ve değerlendirme sürecine alınmıştır.</p>
                <p><strong>Referans No:</strong> {{referenceNumber}}</p>
                <p><strong>Öneri Başlığı:</strong> {{suggestionTitle}}</p>
                <p><strong>Gönderim Tarihi:</strong> {{submittedAt}}</p>
                <p>Önerinizi takip etmek için: <a href="{{suggestionUrl}}">{{suggestionUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["employeeName", "referenceNumber", "suggestionTitle", "submittedAt", "suggestionUrl"]',
        },
        {
            code: 'suggestion-approved',
            name: 'Öneri Onaylandı',
            subject: 'Öneriniz Onaylandı - {{referenceNumber}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Öneriniz Onaylandı!</h2>
                <p>Merhaba {{employeeName}},</p>
                <p>Öneriniz onaylanmıştır. Tebrik ederiz!</p>
                <p><strong>Referans No:</strong> {{referenceNumber}}</p>
                <p><strong>Öneri Başlığı:</strong> {{suggestionTitle}}</p>
                <p><strong>Onay Tarihi:</strong> {{approvedAt}}</p>
                <p>Detaylar için: <a href="{{suggestionUrl}}">{{suggestionUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["employeeName", "referenceNumber", "suggestionTitle", "approvedAt", "suggestionUrl"]',
        },
        {
            code: 'suggestion-rejected',
            name: 'Öneri Reddedildi',
            subject: 'Öneriniz Hakkında - {{referenceNumber}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Öneri Değerlendirme Sonucu</h2>
                <p>Merhaba {{employeeName}},</p>
                <p>Öneriniz değerlendirilmiş ve maalesef kabul edilmemiştir.</p>
                <p><strong>Referans No:</strong> {{referenceNumber}}</p>
                <p><strong>Öneri Başlığı:</strong> {{suggestionTitle}}</p>
                <p><strong>Red Nedeni:</strong> {{rejectionReason}}</p>
                <p>Detaylar için: <a href="{{suggestionUrl}}">{{suggestionUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["employeeName", "referenceNumber", "suggestionTitle", "rejectionReason", "suggestionUrl"]',
        },
        {
            code: 'approval-request',
            name: 'Onay Talebi',
            subject: 'Onayınız Bekleniyor - {{referenceNumber}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Onayınız Bekleniyor</h2>
                <p>Merhaba {{approverName}},</p>
                <p>Yeni bir öneri onayınızı beklemektedir.</p>
                <p><strong>Referans No:</strong> {{referenceNumber}}</p>
                <p><strong>Öneri Başlığı:</strong> {{suggestionTitle}}</p>
                <p><strong>Öneren:</strong> {{suggestionOwner}}</p>
                <p><strong>Onay Seviyesi:</strong> {{approvalLevel}}</p>
                <p>Onaylamak için: <a href="{{approvalUrl}}">{{approvalUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["approverName", "referenceNumber", "suggestionTitle", "suggestionOwner", "approvalLevel", "approvalUrl"]',
        },
        {
            code: 'committee-review',
            name: 'Komite Değerlendirmesi',
            subject: 'Komite Değerlendirmesi Gerekli - {{referenceNumber}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Komite Değerlendirmesi</h2>
                <p>Merhaba {{committeeMemberName}},</p>
                <p>Yeni bir öneri komite değerlendirmesini beklemektedir.</p>
                <p><strong>Referans No:</strong> {{referenceNumber}}</p>
                <p><strong>Öneri Başlığı:</strong> {{suggestionTitle}}</p>
                <p><strong>Öneren:</strong> {{suggestionOwner}}</p>
                <p>Değerlendirmek için: <a href="{{reviewUrl}}">{{reviewUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["committeeMemberName", "referenceNumber", "suggestionTitle", "suggestionOwner", "reviewUrl"]',
        },
        {
            code: 'project-assigned',
            name: 'Proje Ataması',
            subject: 'Yeni Proje Atandı - {{projectName}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Yeni Proje Ataması</h2>
                <p>Merhaba {{leaderName}},</p>
                <p>Yeni bir projeye proje lideri olarak atandınız.</p>
                <p><strong>Proje Adı:</strong> {{projectName}}</p>
                <p><strong>İlgili Öneri:</strong> {{suggestionTitle}}</p>
                <p><strong>Başlangıç Tarihi:</strong> {{startDate}}</p>
                <p><strong>Tahmini Bitiş:</strong> {{estimatedEndDate}}</p>
                <p>Proje detayları için: <a href="{{projectUrl}}">{{projectUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["leaderName", "projectName", "suggestionTitle", "startDate", "estimatedEndDate", "projectUrl"]',
        },
        {
            code: 'project-completed',
            name: 'Proje Tamamlandı',
            subject: 'Proje Tamamlandı - {{projectName}}',
            body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Proje Tamamlandı!</h2>
                <p>Merhaba {{employeeName}},</p>
                <p>Önerinizle ilgili proje başarıyla tamamlanmıştır.</p>
                <p><strong>Proje Adı:</strong> {{projectName}}</p>
                <p><strong>Öneri Başlığı:</strong> {{suggestionTitle}}</p>
                <p><strong>Tamamlanma Tarihi:</strong> {{completionDate}}</p>
                {{#if actualSavings}}
                <p><strong>Sağlanan Tasarruf:</strong> {{actualSavings}} TL</p>
                {{/if}}
                <p>Detaylar için: <a href="{{projectUrl}}">{{projectUrl}}</a></p>
                <br>
                <p>Saygılarımızla,<br>OpEx 5.0 Ekibi</p>
            </div>`,
            variables: '["employeeName", "projectName", "suggestionTitle", "completionDate", "actualSavings", "projectUrl"]',
        },
    ];

    for (const template of emailTemplates) {
        await prisma.emailTemplate.upsert({
            where: { code: template.code },
            update: {},
            create: template,
        });
    }

    console.log('✅ Email templates created:', emailTemplates.length);

    console.log('\n🎉 Seeding completed!');
    console.log('\n📋 Test Accounts:');
    console.log('┌─────────────────┬──────────────┬────────────┐');
    console.log('│ Role            │ Employee ID  │ Password   │');
    console.log('├─────────────────┼──────────────┼────────────┤');
    console.log('│ Admin           │ ADMIN001     │ Admin123   │');
    console.log('│ User            │ USER001      │ Test1234   │');
    console.log('│ User (Operator) │ OPER001      │ Operator1234 │');
    console.log('│ User (Sef)      │ SEFUSR001    │ SefKullanici1234 │');
    console.log('│ Committee Mgr   │ KOMITE001    │ Komite1234 │');
    console.log('│ Approver (Mgr)  │ MUDUR001     │ Onay1234   │');
    console.log('│ Approver (Sef)  │ SEF001       │ SefOnay1234 │');
    console.log('│ Approver (Fab)  │ FAB001       │ Fabrika1234 │');
    console.log('│ Approver (GMY)  │ GMY001       │ GmyOnay1234 │');
    console.log('└─────────────────┴──────────────┴────────────┘');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
