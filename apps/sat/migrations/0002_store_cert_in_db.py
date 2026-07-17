from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sat', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='satcredential',
            name='cer_path',
        ),
        migrations.RemoveField(
            model_name='satcredential',
            name='key_path',
        ),
        migrations.AddField(
            model_name='satcredential',
            name='cer_data',
            field=models.BinaryField(default=b''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='satcredential',
            name='key_data',
            field=models.BinaryField(default=b''),
            preserve_default=False,
        ),
    ]
